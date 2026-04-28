import { useId, useMemo, useState } from 'react'
import {
  ANCHORS,
  GARMENTS,
  MODEL,
  PANTS_VARIANTS,
  SHIRT_VARIANTS,
  type PantsVariantId,
  type ShirtVariantId,
} from '../data/realCatalog'
import { useGarmentPipeline } from '../hooks/useGarmentPipeline'

interface FitTransform {
  /** translation in image-space px */
  dx: number
  dy: number
  /** uniform scale around the anchor center */
  scale: number
  /** rotation in degrees, around the anchor center */
  rotate: number
}

const ZERO: FitTransform = { dx: 0, dy: 0, scale: 1, rotate: 0 }

export function RealOutfitStage() {
  const filterUid = useId().replace(/:/g, '')
  const shirtFilterId = `shirtShadow-${filterUid}`
  const pantsFilterId = `pantsShadow-${filterUid}`

  const pipeline = useGarmentPipeline({
    shirtUrl: GARMENTS.shirt.url,
    shirtOpts: GARMENTS.shirt.pipeline,
    pantsUrl: GARMENTS.pants.url,
    pantsOpts: GARMENTS.pants.pipeline,
  })

  const [showShirt, setShowShirt] = useState(true)
  const [showPants, setShowPants] = useState(true)
  const [shirtVariant, setShirtVariant] = useState<ShirtVariantId>('origin')
  const [pantsVariant, setPantsVariant] = useState<PantsVariantId>('origin')
  const [shirtFit, setShirtFit] = useState<FitTransform>(ZERO)
  const [pantsFit, setPantsFit] = useState<FitTransform>(ZERO)
  const [activeTab, setActiveTab] = useState<'shirt' | 'pants'>('shirt')

  const shirtPlacement = useMemo(() => {
    if (!pipeline.shirt) return null
    return computePlacement(pipeline.shirt, ANCHORS.shirt, shirtFit)
  }, [pipeline.shirt, shirtFit])

  const pantsPlacement = useMemo(() => {
    if (!pipeline.pants) return null
    return computePlacement(pipeline.pants, ANCHORS.pants, pantsFit)
  }, [pipeline.pants, pantsFit])

  const variantFilter = (id: 'shirt' | 'pants', vid: string) => {
    const list = id === 'shirt' ? SHIRT_VARIANTS : PANTS_VARIANTS
    return list.find((v) => v.id === vid)?.filter ?? 'none'
  }

  return (
    <div className="real-stage">
      <div className="real-stage__view">
        <svg
          viewBox={`0 0 ${MODEL.width} ${MODEL.height}`}
          className="real-stage__svg"
          role="img"
          aria-label="Outfit composite"
        >
          <defs>
            <filter id={shirtFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="3"
                stdDeviation="4"
                floodColor="#000"
                floodOpacity="0.28"
              />
            </filter>
            <filter id={pantsFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="5"
                floodColor="#000"
                floodOpacity="0.32"
              />
            </filter>
          </defs>

          <image
            href={MODEL.url}
            x={0}
            y={0}
            width={MODEL.width}
            height={MODEL.height}
            preserveAspectRatio="xMidYMid slice"
          />

          {pipeline.pants && pantsPlacement && (
            <g
              transform={pantsPlacement.transform}
              filter={`url(#${pantsFilterId})`}
              style={{
                opacity: showPants ? 1 : 0,
                transition: 'opacity 220ms ease',
                pointerEvents: 'none',
              }}
            >
              <image
                href={pipeline.pants.url}
                width={pipeline.pants.width}
                height={pipeline.pants.height}
                style={{ filter: variantFilter('pants', pantsVariant) }}
              />
            </g>
          )}

          {pipeline.shirt && shirtPlacement && (
            <g
              transform={shirtPlacement.transform}
              filter={`url(#${shirtFilterId})`}
              style={{
                opacity: showShirt ? 1 : 0,
                transition: 'opacity 220ms ease',
                pointerEvents: 'none',
              }}
            >
              <image
                href={pipeline.shirt.url}
                width={pipeline.shirt.width}
                height={pipeline.shirt.height}
                style={{ filter: variantFilter('shirt', shirtVariant) }}
              />
            </g>
          )}

          <rect
            x={ANCHORS.shirt.anchorX}
            y={ANCHORS.shirt.anchorY}
            width={ANCHORS.shirt.anchorW}
            height={ANCHORS.pants.anchorY - ANCHORS.shirt.anchorY}
            fill="transparent"
            stroke="transparent"
            onClick={() => setActiveTab('shirt')}
            style={{ cursor: 'pointer' }}
          />
          <rect
            x={ANCHORS.pants.anchorX}
            y={ANCHORS.pants.anchorY}
            width={ANCHORS.pants.anchorW}
            height={MODEL.height - ANCHORS.pants.anchorY - 80}
            fill="transparent"
            stroke="transparent"
            onClick={() => setActiveTab('pants')}
            style={{ cursor: 'pointer' }}
          />
        </svg>

        <div className="real-stage__status" aria-live="polite">
          {pipeline.status === 'loading' && (
            <span className="status-pill status-pill--load">
              Preprocessing garments…
            </span>
          )}
          {pipeline.status === 'ready' && (
            <span className="status-pill status-pill--ok">
              Ready · pipeline {pipeline.elapsedMs?.toFixed(0)} ms
            </span>
          )}
          {pipeline.status === 'error' && (
            <span className="status-pill status-pill--err">
              {pipeline.error}
            </span>
          )}
        </div>
      </div>

      <div className="real-stage__panel">
        <div className="real-stage__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'shirt'}
            className={`tab ${activeTab === 'shirt' ? 'tab--on' : ''}`}
            onClick={() => setActiveTab('shirt')}
          >
            Shirt
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pants'}
            className={`tab ${activeTab === 'pants' ? 'tab--on' : ''}`}
            onClick={() => setActiveTab('pants')}
          >
            Pants
          </button>
        </div>

        {activeTab === 'shirt' ? (
          <SlotControls
            label="Shirt"
            shown={showShirt}
            onShownChange={setShowShirt}
            variantId={shirtVariant}
            onVariantChange={(v) => setShirtVariant(v as ShirtVariantId)}
            variants={SHIRT_VARIANTS}
            fit={shirtFit}
            onFitChange={setShirtFit}
          />
        ) : (
          <SlotControls
            label="Pants"
            shown={showPants}
            onShownChange={setShowPants}
            variantId={pantsVariant}
            onVariantChange={(v) => setPantsVariant(v as PantsVariantId)}
            variants={PANTS_VARIANTS}
            fit={pantsFit}
            onFitChange={setPantsFit}
          />
        )}
      </div>
    </div>
  )
}

interface ControlsProps {
  label: string
  shown: boolean
  onShownChange: (v: boolean) => void
  variantId: string
  onVariantChange: (v: string) => void
  variants: ReadonlyArray<{ id: string; label: string }>
  fit: FitTransform
  onFitChange: (next: FitTransform) => void
}

function SlotControls({
  label,
  shown,
  onShownChange,
  variantId,
  onVariantChange,
  variants,
  fit,
  onFitChange,
}: ControlsProps) {
  const update = <K extends keyof FitTransform>(k: K, v: number) =>
    onFitChange({ ...fit, [k]: v })
  return (
    <>
      <div className="row-between">
        <span className="row-label">{label} layer</span>
        <button
          type="button"
          className={`toggle ${shown ? 'toggle--on' : ''}`}
          onClick={() => onShownChange(!shown)}
          aria-pressed={shown}
        >
          {shown ? 'Visible' : 'Hidden'}
        </button>
      </div>

      <div className="chip-row">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`chip ${variantId === v.id ? 'chip--on' : ''}`}
            onClick={() => onVariantChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="fit-grid">
        <FitSlider
          label="Scale"
          min={0.5}
          max={1.8}
          step={0.01}
          value={fit.scale}
          onChange={(v) => update('scale', v)}
          format={(v) => v.toFixed(2)}
        />
        <FitSlider
          label="Rotate (°)"
          min={-12}
          max={12}
          step={0.25}
          value={fit.rotate}
          onChange={(v) => update('rotate', v)}
          format={(v) => v.toFixed(1)}
        />
        <FitSlider
          label="Nudge X (px)"
          min={-160}
          max={160}
          step={1}
          value={fit.dx}
          onChange={(v) => update('dx', v)}
          format={(v) => v.toFixed(0)}
        />
        <FitSlider
          label="Nudge Y (px)"
          min={-160}
          max={160}
          step={1}
          value={fit.dy}
          onChange={(v) => update('dy', v)}
          format={(v) => v.toFixed(0)}
        />
      </div>
      <button
        type="button"
        className="btn btn--secondary"
        onClick={() => onFitChange(ZERO)}
      >
        Reset {label.toLowerCase()} fit
      </button>
    </>
  )
}

interface FitSliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
}

function FitSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: FitSliderProps) {
  return (
    <label className="fit-slider">
      <span className="fit-slider__label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output className="fit-slider__val">{format(value)}</output>
    </label>
  )
}

/* -------------------------------------------------------------------------- */
/* Placement math                                                             */
/* -------------------------------------------------------------------------- */

interface CleanedSize {
  width: number
  height: number
}

interface Anchor {
  anchorX: number
  anchorY: number
  anchorW: number
  stretchY: number
}

/**
 * Width-fit a cleaned garment to an anchor on the model. Vertical extent
 * follows from the garment's own aspect ratio multiplied by `stretchY` —
 * this compensates for flat-lay foreshortening (a worn pant reads taller
 * than the same pant photographed flat).
 *
 * The user's fit transform is applied around the resulting bounding box's
 * top-center pivot so rotations/scales feel anchored to the shoulder line
 * for shirts and the waistline for pants.
 */
function computePlacement(
  cleaned: CleanedSize,
  anchor: Anchor,
  fit: FitTransform,
) {
  const baseScaleX = anchor.anchorW / cleaned.width
  const baseScaleY = baseScaleX * anchor.stretchY

  const drawW = cleaned.width * baseScaleX
  const drawH = cleaned.height * baseScaleY
  const baseX = anchor.anchorX + (anchor.anchorW - drawW) / 2
  const baseY = anchor.anchorY

  const pivotX = anchor.anchorX + anchor.anchorW / 2 + fit.dx
  const pivotY = anchor.anchorY + fit.dy

  const transform = [
    `translate(${pivotX} ${pivotY})`,
    `rotate(${fit.rotate})`,
    `scale(${fit.scale})`,
    `translate(${-pivotX} ${-pivotY})`,
    `translate(${fit.dx} ${fit.dy})`,
    `translate(${baseX} ${baseY})`,
    `scale(${baseScaleX} ${baseScaleY})`,
  ].join(' ')

  return { transform, drawW, drawH, baseX, baseY }
}
