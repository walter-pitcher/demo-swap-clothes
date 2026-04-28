import { useEffect, useRef } from 'react'
import type { CleanGarment } from '../lib/imagePipeline'

interface Props {
  label: string
  garment?: CleanGarment
  loading: boolean
}

const STAGE_W = 280

/**
 * Renders the three pipeline stages side-by-side: raw, alpha mask
 * (chroma-keyed + flood), and the cleaned/cropped final asset.
 * The mask is composited onto a checkerboard so transparency is visible.
 */
export function PreprocessSteps({ label, garment, loading }: Props) {
  const rawRef = useRef<HTMLCanvasElement>(null)
  const maskRef = useRef<HTMLCanvasElement>(null)
  const cleanRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!garment) return
    drawScaled(rawRef.current, garment.raw, STAGE_W)
    drawScaledOnChecker(maskRef.current, garment.mask, STAGE_W)
    drawScaledOnChecker(cleanRef.current, garment.cleaned, STAGE_W)
  }, [garment])

  return (
    <div className="preprocess-row">
      <h3 className="preprocess-row__title">{label}</h3>
      <div className="preprocess-stages">
        <Stage
          title="1. Raw upload"
          subtitle="As provided by the seller — light flat-lay bg, full frame."
          canvasRef={rawRef}
          loading={loading}
        />
        <Stage
          title="2. Background removed"
          subtitle="Chroma-key + connected-component flood from border. Internal whites preserved."
          canvasRef={maskRef}
          loading={loading}
        />
        <Stage
          title="3. Feathered + cropped"
          subtitle="Premultiplied-alpha edge repair, soft 1.5 px feather, snapped to bbox."
          canvasRef={cleanRef}
          loading={loading}
        />
      </div>
    </div>
  )
}

interface StageProps {
  title: string
  subtitle: string
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  loading: boolean
}

function Stage({ title, subtitle, canvasRef, loading }: StageProps) {
  return (
    <figure className="preprocess-stage">
      <div className="preprocess-stage__canvas">
        {loading && <div className="preprocess-stage__skel" />}
        <canvas ref={canvasRef} aria-label={title} />
      </div>
      <figcaption>
        <div className="preprocess-stage__title">{title}</div>
        <div className="preprocess-stage__sub">{subtitle}</div>
      </figcaption>
    </figure>
  )
}

function drawScaled(
  target: HTMLCanvasElement | null,
  src: HTMLCanvasElement,
  maxW: number,
) {
  if (!target) return
  const ratio = src.height / src.width
  const w = Math.min(maxW, src.width)
  const h = w * ratio
  target.width = Math.round(w * devicePixelRatio)
  target.height = Math.round(h * devicePixelRatio)
  target.style.width = `${w}px`
  target.style.height = `${h}px`
  const ctx = target.getContext('2d')
  if (!ctx) return
  ctx.scale(devicePixelRatio, devicePixelRatio)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, w, h)
}

function drawScaledOnChecker(
  target: HTMLCanvasElement | null,
  src: HTMLCanvasElement,
  maxW: number,
) {
  if (!target) return
  const ratio = src.height / src.width
  const w = Math.min(maxW, src.width)
  const h = w * ratio
  target.width = Math.round(w * devicePixelRatio)
  target.height = Math.round(h * devicePixelRatio)
  target.style.width = `${w}px`
  target.style.height = `${h}px`
  const ctx = target.getContext('2d')
  if (!ctx) return
  ctx.scale(devicePixelRatio, devicePixelRatio)

  const tile = 10
  for (let y = 0; y < h; y += tile) {
    for (let x = 0; x < w; x += tile) {
      const dark = ((x / tile + y / tile) | 0) % 2 === 0
      ctx.fillStyle = dark ? '#cfcad6' : '#ebe7ef'
      ctx.fillRect(x, y, tile, tile)
    }
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, w, h)
}
