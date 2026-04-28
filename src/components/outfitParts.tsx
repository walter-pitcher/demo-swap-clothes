import type { ReactNode } from 'react'

/** Shared viewBox for all outfit SVGs */
export const VIEWBOX = '0 0 220 480'

/** Base figure (skin + shoes). Clothing is drawn on top in separate groups. */
export function BodyBase() {
  return (
    <g id="body-base" aria-hidden>
      <ellipse cx="110" cy="52" rx="26" ry="30" fill="#d4a574" />
      <path
        d="M 94 78 Q 110 88 126 78 L 128 95 L 92 95 Z"
        fill="#c89563"
      />
      {/* arms skin */}
      <path
        d="M 62 98 L 78 95 L 82 168 L 68 172 Z"
        fill="#d4a574"
      />
      <path
        d="M 158 95 L 174 98 L 168 172 L 154 168 Z"
        fill="#d4a574"
      />
      <ellipse cx="68" cy="176" rx="9" ry="8" fill="#d4a574" />
      <ellipse cx="152" cy="176" rx="9" ry="8" fill="#d4a574" />
      {/* legs skin (below pants hem) */}
      <path
        d="M 86 360 L 92 360 L 96 410 L 88 418 Z"
        fill="#d4a574"
      />
      <path
        d="M 128 360 L 134 360 L 138 418 L 130 410 Z"
        fill="#d4a574"
      />
      {/* shoes */}
      <ellipse cx="92" cy="422" rx="18" ry="9" fill="#2a2a32" />
      <ellipse cx="128" cy="422" rx="18" ry="9" fill="#2a2a32" />
      <ellipse cx="110" cy="460" rx="70" ry="10" fill="rgba(0,0,0,0.12)" />
    </g>
  )
}

export function ShirtLayer({
  variantId,
  opacity,
  filterId,
}: {
  variantId: string
  opacity: number
  filterId: string
}) {
  const inner = SHIRT_INNERS[variantId] ?? SHIRT_INNERS['oxford']
  return (
    <g
      className="garment-layer shirt-layer"
      style={{ opacity, transition: 'opacity 180ms ease-out' }}
      filter={`url(#${filterId})`}
    >
      {inner}
    </g>
  )
}

export function PantsLayer({
  variantId,
  opacity,
  filterId,
}: {
  variantId: string
  opacity: number
  filterId: string
}) {
  const inner = PANTS_INNERS[variantId] ?? PANTS_INNERS['indigo']
  return (
    <g
      className="garment-layer pants-layer"
      style={{ opacity, transition: 'opacity 180ms ease-out' }}
      filter={`url(#${filterId})`}
    >
      {inner}
    </g>
  )
}

const SHIRT_INNERS: Record<string, ReactNode> = {
  oxford: (
    <>
      <path
        d="M 78 92 L 142 92 L 152 100 L 162 110 L 168 175 L 148 182 L 140 210
           L 80 210 L 72 182 L 52 175 L 58 110 L 68 100 Z"
        fill="#1e3a5f"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />
      <path
        d="M 88 92 L 132 92 L 128 108 L 92 108 Z"
        fill="rgba(255,255,255,0.06)"
      />
    </>
  ),
  coral: (
    <path
      d="M 78 92 L 142 92 L 152 100 L 162 110 L 168 175 L 148 182 L 140 210
         L 80 210 L 72 182 L 52 175 L 58 110 L 68 100 Z"
      fill="#e07a5f"
      stroke="rgba(0,0,0,0.07)"
      strokeWidth="1"
    />
  ),
  stripe: (
    <g>
      <path
        d="M 78 92 L 142 92 L 152 100 L 162 110 L 168 175 L 148 182 L 140 210
           L 80 210 L 72 182 L 52 175 L 58 110 L 68 100 Z"
        fill="#f5f0e6"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />
      {[104, 118, 132, 146, 160, 174, 188].map((y) => (
        <line
          key={y}
          x1="60"
          y1={y}
          x2="160"
          y2={y}
          stroke="#2c2c32"
          strokeWidth="3"
          opacity="0.2"
        />
      ))}
    </g>
  ),
  knit: (
    <g>
      <path
        d="M 78 92 L 142 92 L 150 102 L 160 112 L 165 178 L 150 188 L 136 212
           L 84 212 L 70 188 L 55 178 L 60 112 L 70 102 Z"
        fill="#5c6b7a"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      <text
        x="110"
        y="155"
        textAnchor="middle"
        fill="rgba(255,255,255,0.15)"
        fontSize="10"
        fontFamily="system-ui, sans-serif"
      >
        knit
      </text>
    </g>
  ),
}

const PANTS_INNERS: Record<string, ReactNode> = {
  indigo: (
    <path
      d="M 80 205 L 140 205 L 148 240 L 142 360 L 118 360 L 110 270 L 102 360
         L 78 360 L 72 240 Z"
      fill="#2d3f6b"
      stroke="rgba(0,0,0,0.1)"
      strokeWidth="1"
    />
  ),
  khaki: (
    <path
      d="M 80 205 L 140 205 L 148 240 L 142 360 L 118 360 L 110 275 L 102 360
         L 78 360 L 72 240 Z"
      fill="#b8a37a"
      stroke="rgba(0,0,0,0.08)"
      strokeWidth="1"
    />
  ),
  charcoal: (
    <path
      d="M 80 205 L 140 205 L 146 238 L 140 362 L 120 362 L 110 268 L 100 362
         L 80 362 L 74 238 Z"
      fill="#3a3a42"
      stroke="rgba(255,255,255,0.06)"
      strokeWidth="1"
    />
  ),
}
