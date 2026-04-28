/**
 * Deterministic image-processing pipeline used to normalize garment cutouts
 * before they hit the layered viewer.
 *
 * Stages:
 *   1. loadImage        – fetch + decode
 *   2. removeBackground – chroma-keyed alpha with connected-component flood
 *   3. repairEdges      – premultiplied-alpha blur to kill bg color halos
 *   4. featherAlpha     – soft 1-2 px alpha falloff
 *   5. tightCrop        – snap to non-transparent bbox
 *   6. matchExposure    – optional luminance scale to fit scene lighting
 *
 * All steps run on plain Canvas2D / typed arrays so they work in every
 * modern browser with no external libraries.
 */

export interface CleanGarment {
  raw: HTMLCanvasElement
  mask: HTMLCanvasElement
  cleaned: HTMLCanvasElement
  bbox: BBox
  width: number
  height: number
  url: string
}

export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

export interface BackgroundOpts {
  /** RGB distance below which a pixel is fully transparent */
  innerThreshold?: number
  /** RGB distance above which a pixel is fully opaque */
  outerThreshold?: number
  /** Only kill pixels reachable from the image border via similar bg colors */
  requireBorderConnectivity?: boolean
  /**
   * Pixels with HSV saturation below this AND luma close to bg are treated as
   * background even if their colour distance is moderate. Catches textured
   * walls and drop shadows while sparing saturated garment pixels.
   * 0 disables; typical values 0.10–0.22.
   */
  saturationFloor?: number
  /**
   * Maximum |luma - bgLuma| accepted for a low-saturation pixel to be flooded.
   * Larger values let the flood expand through deeper shadows.
   */
  shadowLumaTol?: number
}

export interface PreprocessOpts extends BackgroundOpts {
  feather?: number
  exposureMatch?: { targetLuma: number; strength: number }
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error(`Failed to load ${src}: ${String(e)}`))
    img.src = src
  })
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function ctxOf(c: HTMLCanvasElement) {
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  return ctx
}

export function imageToCanvas(
  img: HTMLImageElement | HTMLCanvasElement,
): HTMLCanvasElement {
  const c = makeCanvas(img.width, img.height)
  ctxOf(c).drawImage(img, 0, 0)
  return c
}

/* -------------------------------------------------------------------------- */
/* Background sampling                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Estimate background color from a thin border ring. We collect samples,
 * weight by their cluster mass (k=1 nearest mean), and return the median
 * channel-wise — robust to a few non-bg border pixels (stray hairs, etc.).
 */
function estimateBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): [number, number, number] {
  const ring = 6
  const stride = Math.max(1, Math.floor(Math.min(w, h) / 200))
  const reds: number[] = []
  const greens: number[] = []
  const blues: number[] = []

  for (let y = 0; y < h; y++) {
    if (y >= ring && y < h - ring) continue
    for (let x = 0; x < w; x += stride) {
      const i = (y * w + x) * 4
      reds.push(data[i])
      greens.push(data[i + 1])
      blues.push(data[i + 2])
    }
  }
  for (let x = 0; x < w; x++) {
    if (x >= ring && x < w - ring) continue
    for (let y = 0; y < h; y += stride) {
      const i = (y * w + x) * 4
      reds.push(data[i])
      greens.push(data[i + 1])
      blues.push(data[i + 2])
    }
  }

  reds.sort((a, b) => a - b)
  greens.sort((a, b) => a - b)
  blues.sort((a, b) => a - b)
  const m = (a: number[]) => a[Math.floor(a.length / 2)]
  return [m(reds), m(greens), m(blues)]
}

/* -------------------------------------------------------------------------- */
/* Step 2: chroma-key with connected-component flood                          */
/* -------------------------------------------------------------------------- */

/**
 * Per-pixel: alpha = 0 if very close to bg color, 255 if far, smooth linear
 * falloff between thresholds — gives a continuous feather automatically.
 *
 * Then if requireBorderConnectivity, run a flood from the border so internal
 * bg-colored regions (a white tag on a black shirt) are preserved.
 */
export function removeBackground(
  src: HTMLCanvasElement,
  opts: BackgroundOpts = {},
): { mask: HTMLCanvasElement; alpha: Uint8ClampedArray } {
  const inner = opts.innerThreshold ?? 22
  const outer = opts.outerThreshold ?? 70
  const flood = opts.requireBorderConnectivity ?? true
  const satFloor = opts.saturationFloor ?? 0
  const shadowTol = opts.shadowLumaTol ?? 80

  const w = src.width
  const h = src.height
  const data = ctxOf(src).getImageData(0, 0, w, h).data
  const bg = estimateBackground(data, w, h)
  const bgLuma = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]

  const N = w * h
  const dist = new Float32Array(N)
  const sat = new Float32Array(N)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const dr = r - bg[0]
    const dg = g - bg[1]
    const db = b - bg[2]
    dist[p] = Math.sqrt(dr * dr + dg * dg + db * db)
    const mx = r > g ? (r > b ? r : b) : g > b ? g : b
    const mn = r < g ? (r < b ? r : b) : g < b ? g : b
    sat[p] = mx === 0 ? 0 : (mx - mn) / mx
  }

  // Per-pixel "is this a plausible bg pixel" test. Used by the flood. Combines:
  //   • short colour distance (close to bgRef) — uniform bg
  //   • low saturation + luma close to bgLuma — wall texture, shadows
  const floodPass = (p: number) => {
    if (dist[p] <= outer) return true
    if (satFloor > 0 && sat[p] < satFloor) {
      const idx = p * 4
      const luma =
        0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]
      if (Math.abs(luma - bgLuma) < shadowTol) return true
    }
    return false
  }

  const baseAlpha = new Uint8ClampedArray(N)
  for (let p = 0; p < N; p++) {
    const d = dist[p]
    if (d <= inner) baseAlpha[p] = 0
    else if (d >= outer) baseAlpha[p] = 255
    else baseAlpha[p] = Math.round(((d - inner) / (outer - inner)) * 255)
  }

  let visited: Uint8Array | null = null
  if (flood) {
    visited = new Uint8Array(N)
    const stack: number[] = []
    const seedFloor = Math.max(inner, outer * 0.7)
    const seed = (p: number) => {
      if (visited![p]) return
      if (dist[p] <= seedFloor || floodPass(p)) {
        visited![p] = 1
        stack.push(p)
      }
    }
    for (let x = 0; x < w; x++) {
      seed(x)
      seed((h - 1) * w + x)
    }
    for (let y = 0; y < h; y++) {
      seed(y * w)
      seed(y * w + (w - 1))
    }

    while (stack.length) {
      const p = stack.pop()!
      const x = p % w
      const y = (p / w) | 0
      if (x > 0) {
        const n = p - 1
        if (!visited[n] && floodPass(n)) {
          visited[n] = 1
          stack.push(n)
        }
      }
      if (x < w - 1) {
        const n = p + 1
        if (!visited[n] && floodPass(n)) {
          visited[n] = 1
          stack.push(n)
        }
      }
      if (y > 0) {
        const n = p - w
        if (!visited[n] && floodPass(n)) {
          visited[n] = 1
          stack.push(n)
        }
      }
      if (y < h - 1) {
        const n = p + w
        if (!visited[n] && floodPass(n)) {
          visited[n] = 1
          stack.push(n)
        }
      }
    }
  }

  const out = new Uint8ClampedArray(data.length)
  for (let p = 0, i = 0; p < N; p++, i += 4) {
    out[i] = data[i]
    out[i + 1] = data[i + 1]
    out[i + 2] = data[i + 2]
    if (visited) {
      // Hard binary mask: kill anything connected to the border via a
      // bg-likely path; keep everything else (including internal lights
      // and saturated highlights). featherEdges() softens the boundary.
      out[i + 3] = visited[p] ? 0 : 255
    } else {
      // No flood requested → fall back to smooth chroma-key alpha
      out[i + 3] = baseAlpha[p]
    }
  }

  const result = makeCanvas(w, h)
  ctxOf(result).putImageData(new ImageData(out, w, h), 0, 0)
  return { mask: result, alpha: out.slice() }
}

/* -------------------------------------------------------------------------- */
/* Step 3 + 4: edge repair with premultiplied alpha + feather                 */
/* -------------------------------------------------------------------------- */

/**
 * Repair fringe halos and add a soft feather. We:
 *   1. Premultiply RGB by alpha
 *   2. Box-blur both premult-RGB and alpha together
 *   3. Unpremultiply
 *
 * This bleeds garment color into transparent pixels at the edge instead of
 * letting the original bg color leak in, eliminating white halos.
 */
export function featherEdges(
  canvas: HTMLCanvasElement,
  radius: number,
): HTMLCanvasElement {
  if (radius <= 0) return canvas
  const w = canvas.width
  const h = canvas.height
  const src = ctxOf(canvas).getImageData(0, 0, w, h).data

  const N = w * h
  const pr = new Float32Array(N)
  const pg = new Float32Array(N)
  const pb = new Float32Array(N)
  const pa = new Float32Array(N)
  for (let p = 0, i = 0; p < N; p++, i += 4) {
    const a = src[i + 3] / 255
    pr[p] = src[i] * a
    pg[p] = src[i + 1] * a
    pb[p] = src[i + 2] * a
    pa[p] = src[i + 3]
  }

  const r = Math.max(1, Math.round(radius))
  boxBlur(pr, w, h, r)
  boxBlur(pg, w, h, r)
  boxBlur(pb, w, h, r)
  boxBlur(pa, w, h, r)

  const out = new Uint8ClampedArray(src.length)
  for (let p = 0, i = 0; p < N; p++, i += 4) {
    const a = pa[p]
    if (a < 1) {
      out[i] = 0
      out[i + 1] = 0
      out[i + 2] = 0
      out[i + 3] = 0
      continue
    }
    const inv = 255 / a
    out[i] = clamp255(pr[p] * inv)
    out[i + 1] = clamp255(pg[p] * inv)
    out[i + 2] = clamp255(pb[p] * inv)
    out[i + 3] = clamp255(a)
  }

  const result = makeCanvas(w, h)
  ctxOf(result).putImageData(new ImageData(out, w, h), 0, 0)
  return result
}

function clamp255(v: number) {
  if (v < 0) return 0
  if (v > 255) return 255
  return v
}

/** Two-pass separable box blur on a single Float32 channel, in-place. */
function boxBlur(buf: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(buf.length)
  blur1D(buf, tmp, w, h, r, true)
  blur1D(tmp, buf, w, h, r, false)
}

function blur1D(
  src: Float32Array,
  dst: Float32Array,
  w: number,
  h: number,
  r: number,
  horizontal: boolean,
) {
  const span = r * 2 + 1
  if (horizontal) {
    for (let y = 0; y < h; y++) {
      let sum = 0
      const row = y * w
      for (let k = -r; k <= r; k++) sum += src[row + clampIdx(k, w)]
      for (let x = 0; x < w; x++) {
        dst[row + x] = sum / span
        const removeIdx = clampIdx(x - r, w)
        const addIdx = clampIdx(x + r + 1, w)
        sum += src[row + addIdx] - src[row + removeIdx]
      }
    }
  } else {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let k = -r; k <= r; k++) sum += src[clampIdx(k, h) * w + x]
      for (let y = 0; y < h; y++) {
        dst[y * w + x] = sum / span
        const removeIdx = clampIdx(y - r, h)
        const addIdx = clampIdx(y + r + 1, h)
        sum += src[addIdx * w + x] - src[removeIdx * w + x]
      }
    }
  }
}

function clampIdx(i: number, n: number) {
  if (i < 0) return 0
  if (i >= n) return n - 1
  return i
}

/* -------------------------------------------------------------------------- */
/* Step 5: tight crop                                                         */
/* -------------------------------------------------------------------------- */

export function tightBBox(canvas: HTMLCanvasElement, alphaCutoff = 8): BBox {
  const w = canvas.width
  const h = canvas.height
  const data = ctxOf(canvas).getImageData(0, 0, w, h).data
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > alphaCutoff) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w, h }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

export function cropTo(
  canvas: HTMLCanvasElement,
  bbox: BBox,
): HTMLCanvasElement {
  const out = makeCanvas(bbox.w, bbox.h)
  ctxOf(out).drawImage(
    canvas,
    bbox.x,
    bbox.y,
    bbox.w,
    bbox.h,
    0,
    0,
    bbox.w,
    bbox.h,
  )
  return out
}

/* -------------------------------------------------------------------------- */
/* Step 6: scene-aware exposure match                                         */
/* -------------------------------------------------------------------------- */

/**
 * Scale RGB toward a target mean luma so the garment doesn't read as
 * pasted-from-elsewhere. Strength 0..1 blends original and matched.
 */
export function matchExposure(
  canvas: HTMLCanvasElement,
  targetLuma: number,
  strength = 0.6,
): HTMLCanvasElement {
  const w = canvas.width
  const h = canvas.height
  const ctx = ctxOf(canvas)
  const img = ctx.getImageData(0, 0, w, h)
  const data = img.data

  let sum = 0
  let count = 0
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 32) continue
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    count++
  }
  if (count === 0) return canvas
  const mean = sum / count
  if (mean < 1) return canvas

  const gain = 1 + (targetLuma / mean - 1) * strength

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 1) continue
    data[i] = clamp255(data[i] * gain)
    data[i + 1] = clamp255(data[i + 1] * gain)
    data[i + 2] = clamp255(data[i + 2] * gain)
  }
  const out = makeCanvas(w, h)
  ctxOf(out).putImageData(img, 0, 0)
  return out
}

/* -------------------------------------------------------------------------- */
/* Public pipeline                                                            */
/* -------------------------------------------------------------------------- */

export async function preprocessGarment(
  url: string,
  opts: PreprocessOpts = {},
): Promise<CleanGarment> {
  const img = await loadImage(url)
  const raw = imageToCanvas(img)
  const { mask } = removeBackground(raw, opts)
  const feathered = featherEdges(mask, opts.feather ?? 1.5)
  const lit = opts.exposureMatch
    ? matchExposure(feathered, opts.exposureMatch.targetLuma, opts.exposureMatch.strength)
    : feathered
  const bbox = tightBBox(lit)
  const cleaned = cropTo(lit, bbox)
  const url2 = cleaned.toDataURL('image/png')
  return {
    raw,
    mask,
    cleaned,
    bbox,
    width: cleaned.width,
    height: cleaned.height,
    url: url2,
  }
}
