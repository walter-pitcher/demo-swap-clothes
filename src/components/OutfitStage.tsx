import { useCallback, useId, useState } from 'react'
import { PANTS_OPTIONS, SHIRT_OPTIONS } from '../data/outfitCatalog'
import { BodyBase, PantsLayer, ShirtLayer, VIEWBOX } from './outfitParts'
import type { GarmentSlot } from '../types'

const CROSS_MS = 200

export function OutfitStage() {
  const uid = useId()
  const filterId = `g-soft-${uid.replace(/:/g, '')}`

  const [activeSlot, setActiveSlot] = useState<GarmentSlot | null>(null)
  const [shirtId, setShirtId] = useState('oxford')
  const [pantsId, setPantsId] = useState('indigo')

  const [pendingShirt, setPendingShirt] = useState('oxford')
  const [pendingPants, setPendingPants] = useState('indigo')
  const [shirtOpacity, setShirtOpacity] = useState({ cur: 1, next: 0 })
  const [pantsOpacity, setPantsOpacity] = useState({ cur: 1, next: 0 })

  const crossfadeTo = useCallback(
    (slot: GarmentSlot, nextId: string) => {
      if (slot === 'shirt') {
        if (nextId === shirtId) return
        setPendingShirt(nextId)
        setShirtOpacity({ cur: 1, next: 0 })
        requestAnimationFrame(() => {
          setShirtOpacity({ cur: 0, next: 1 })
        })
        window.setTimeout(() => {
          setShirtId(nextId)
          setPendingShirt(nextId)
          setShirtOpacity({ cur: 1, next: 0 })
        }, CROSS_MS)
      } else {
        if (nextId === pantsId) return
        setPendingPants(nextId)
        setPantsOpacity({ cur: 1, next: 0 })
        requestAnimationFrame(() => {
          setPantsOpacity({ cur: 0, next: 1 })
        })
        window.setTimeout(() => {
          setPantsId(nextId)
          setPendingPants(nextId)
          setPantsOpacity({ cur: 1, next: 0 })
        }, CROSS_MS)
      }
    },
    [pantsId, shirtId],
  )

  return (
    <div className="outfit-stage">
      <div className="outfit-stage__frame">
        <svg
          viewBox={VIEWBOX}
          className="outfit-stage__svg"
          role="img"
          aria-label="Interactive outfit figure. Tap shirt or pants."
        >
          <title>Outfit preview</title>
          <defs>
            <filter
              id={filterId}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow
                dx="0"
                dy="1.5"
                stdDeviation="1.2"
                floodColor="#000"
                floodOpacity="0.18"
              />
            </filter>
          </defs>
          <BodyBase />
          <g className="outfit-stage__stack pants-stack">
            <PantsLayer
              variantId={pantsId}
              opacity={pantsOpacity.cur}
              filterId={filterId}
            />
            {pantsOpacity.next > 0 && (
              <PantsLayer
                variantId={pendingPants}
                opacity={pantsOpacity.next}
                filterId={filterId}
              />
            )}
          </g>
          <g className="outfit-stage__stack shirt-stack">
            <ShirtLayer
              variantId={shirtId}
              opacity={shirtOpacity.cur}
              filterId={filterId}
            />
            {shirtOpacity.next > 0 && (
              <ShirtLayer
                variantId={pendingShirt}
                opacity={shirtOpacity.next}
                filterId={filterId}
              />
            )}
          </g>
          {/* Hit targets: almost invisible fill for reliable pointer events */}
          <path
            d="M 50 88 L 170 88 L 175 210 L 45 210 Z"
            fill="white"
            fillOpacity="0.02"
            stroke="none"
            className={`hit hit--shirt ${activeSlot === 'shirt' ? 'hit--active' : ''}`}
            onClick={() =>
              setActiveSlot((s) => (s === 'shirt' ? null : 'shirt'))
            }
          />
          <path
            d="M 68 200 L 152 200 L 160 365 L 60 365 Z"
            fill="white"
            fillOpacity="0.02"
            stroke="none"
            className={`hit hit--pants ${activeSlot === 'pants' ? 'hit--active' : ''}`}
            onClick={() =>
              setActiveSlot((s) => (s === 'pants' ? null : 'pants'))
            }
          />
        </svg>
        <div className="outfit-stage__badges" aria-hidden>
          <span className="badge">Layered SVG</span>
          <span className="badge">No API</span>
        </div>
      </div>

      <div className="outfit-stage__picker" role="region" aria-label="Swap options">
        <p className="outfit-stage__hint">
          {activeSlot === null && 'Click the shirt or pants on the figure to choose a slot.'}
          {activeSlot === 'shirt' && 'Shirt slot — pick a style below.'}
          {activeSlot === 'pants' && 'Pants slot — pick a style below.'}
        </p>
        <div className="chip-row">
          {SHIRT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`chip ${shirtId === opt.id ? 'chip--on' : ''}`}
              onClick={() => {
                setActiveSlot('shirt')
                crossfadeTo('shirt', opt.id)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="chip-row">
          {PANTS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`chip ${pantsId === opt.id ? 'chip--on' : ''}`}
              onClick={() => {
                setActiveSlot('pants')
                crossfadeTo('pants', opt.id)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
