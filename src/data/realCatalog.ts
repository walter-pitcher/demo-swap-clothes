/**
 * Canonical placement for the demo model in origin.jpg.
 * Coordinates are in image-space pixels of the source photo.
 *
 * In production this metadata is attached to the model rig once and reused
 * for every garment that lands in the catalog. The numbers below were
 * read off the source studio shot.
 */

export const MODEL = {
  url: '/origin.jpg',
  width: 683,
  height: 1024,
  /** Mean luma of the model's torso/hip area, sampled in advance. */
  torsoLuma: 178,
  pantsLuma: 162,
}

/**
 * Canonical anchor box on the model. anchorW is the body's apparent width at
 * that band; the garment is scaled width-first, then stretched vertically by
 * `stretchY` to compensate for the fact that flat-lay garments are squatter
 * than worn garments (a baggy jean photographed flat is ~1:1 but reads as
 * ~1:1.6 when on a person).
 */
export const ANCHORS = {
  shirt: {
    anchorX: 178,
    anchorY: 246,
    anchorW: 332,
    stretchY: 1.2,
  },
  pants: {
    anchorX: 168,
    anchorY: 528,
    anchorW: 350,
    stretchY: 1.0,
  },
}

/**
 * Per-garment ingestion config. `targetLuma` lets the pipeline scale exposure
 * to roughly match the model photo's lighting.
 */
export const GARMENTS = {
  shirt: {
    url: '/shirt.png',
    pipeline: {
      innerThreshold: 36,
      outerThreshold: 90,
      feather: 1.6,
      saturationFloor: 0.18,
      shadowLumaTol: 95,
      exposureMatch: { targetLuma: MODEL.torsoLuma, strength: 0.0 },
    },
  },
  pants: {
    url: '/pants.png',
    pipeline: {
      innerThreshold: 28,
      outerThreshold: 78,
      feather: 1.6,
      saturationFloor: 0.20,
      shadowLumaTol: 110,
      exposureMatch: { targetLuma: MODEL.pantsLuma, strength: 0.2 },
    },
  },
} as const

/**
 * Color/finish variants, applied as CSS filters at composite time so the
 * preprocessed asset is loaded once and re-tinted per click — no extra fetch,
 * no extra preprocessing.
 */
export const SHIRT_VARIANTS = [
  { id: 'origin', label: 'Original', filter: 'none' },
  {
    id: 'navy',
    label: 'Midnight navy',
    filter: 'brightness(1.18) sepia(0.4) hue-rotate(180deg) saturate(1.4)',
  },
  {
    id: 'forest',
    label: 'Forest',
    filter: 'brightness(1.2) sepia(0.55) hue-rotate(60deg) saturate(1.6)',
  },
  {
    id: 'burgundy',
    label: 'Burgundy',
    filter: 'brightness(1.18) sepia(0.6) hue-rotate(-20deg) saturate(2)',
  },
] as const

export const PANTS_VARIANTS = [
  { id: 'origin', label: 'Light wash', filter: 'none' },
  {
    id: 'mid',
    label: 'Mid wash',
    filter: 'brightness(0.78) saturate(1.1) hue-rotate(-6deg)',
  },
  {
    id: 'dark',
    label: 'Dark wash',
    filter: 'brightness(0.55) saturate(1.2) hue-rotate(-10deg)',
  },
  {
    id: 'black',
    label: 'Black',
    filter: 'brightness(0.32) saturate(0.6)',
  },
] as const

export type ShirtVariantId = (typeof SHIRT_VARIANTS)[number]['id']
export type PantsVariantId = (typeof PANTS_VARIANTS)[number]['id']
