import { useId, useState } from 'react'

const SHIRT_D =
  'M 28 20 L 92 20 L 102 28 L 112 38 L 118 103 L 98 110 L 90 138 L 30 138 L 22 110 L 2 103 L 8 38 L 18 28 Z'

export function AlignmentPlayground() {
  const id = useId().replace(/:/g, '')
  const filterId = `ap-shadow-${id}`

  const [rot, setRot] = useState(-6.5)
  const [scale, setScale] = useState(1.05)
  const [tx, setTx] = useState(6)
  const [ty, setTy] = useState(4)

  const reset = () => {
    setRot(0)
    setScale(1)
    setTx(0)
    setTy(0)
  }

  return (
    <div className="align-play">
      <div className="align-play__intro">
        <h3 className="align-play__title">Manual align (queue fallback)</h3>
        <p>
          When auto keypoints are weak, an internal tool nudges rotation,
          scale, and position. One-time per SKU. This panel is a live mock of
          that control.
        </p>
      </div>
      <div className="align-play__row">
        <div className="align-play__canvas">
          <svg viewBox="0 0 180 160" role="img" aria-label="Alignment preview">
            <rect
              width="100%"
              height="100%"
              fill="var(--panel-2)"
              rx="8"
            />
            <defs>
              <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow
                  dx="0"
                  dy="1.2"
                  stdDeviation="1"
                  floodColor="#000"
                  floodOpacity="0.15"
                />
              </filter>
            </defs>
            <g
              transform={`translate(50 32) translate(${tx} ${ty}) rotate(${rot} 60 70) scale(${scale})`}
              filter={`url(#${filterId})`}
            >
              <path
                d={SHIRT_D}
                fill="#1e3a5f"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="1"
              />
            </g>
            <g
              stroke="var(--border-strong)"
              strokeWidth="0.5"
              strokeDasharray="4 3"
              opacity="0.5"
            >
              <line x1="50" y1="0" x2="50" y2="160" />
              <line x1="0" y1="100" x2="180" y2="100" />
            </g>
          </svg>
        </div>
        <div className="align-play__controls">
          <label className="align-play__label">
            <span>Rotation (°)</span>
            <input
              type="range"
              min="-20"
              max="20"
              step="0.5"
              value={rot}
              onChange={(e) => setRot(Number(e.target.value))}
            />
            <output>{rot.toFixed(1)}</output>
          </label>
          <label className="align-play__label">
            <span>Scale</span>
            <input
              type="range"
              min="0.85"
              max="1.2"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
            <output>{scale.toFixed(2)}</output>
          </label>
          <label className="align-play__label">
            <span>Nudge X</span>
            <input
              type="range"
              min="-15"
              max="15"
              step="0.5"
              value={tx}
              onChange={(e) => setTx(Number(e.target.value))}
            />
            <output>{tx.toFixed(1)}</output>
          </label>
          <label className="align-play__label">
            <span>Nudge Y</span>
            <input
              type="range"
              min="-15"
              max="15"
              step="0.5"
              value={ty}
              onChange={(e) => setTy(Number(e.target.value))}
            />
            <output>{ty.toFixed(1)}</output>
          </label>
          <button type="button" className="btn btn--secondary" onClick={reset}>
            Snap to neutral (0,0,1,0)
          </button>
        </div>
      </div>
    </div>
  )
}
