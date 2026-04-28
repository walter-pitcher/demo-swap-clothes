/**
 * Visual explanation: seller cutout is misaligned; after CV + affine snap
 * it matches canonical garment space (same path, different transform).
 */
const DEMO_SHIRT_D =
  'M 78 40 L 142 40 L 152 48 L 162 58 L 168 123 L 148 130 L 140 158 L 80 158 L 72 130 L 52 123 L 58 58 L 68 48 Z'

export function PipelineCompare() {
  return (
    <div className="pipeline-compare">
      <div className="pipeline-compare__card">
        <h3 className="pipeline-compare__title">Raw seller cutout</h3>
        <p className="pipeline-compare__sub">
          Simulated: off-center, wrong scale, slight rotation—typical when
          sellers upload inconsistent photography.
        </p>
        <svg
          viewBox="0 0 220 200"
          className="pipeline-compare__svg"
          role="img"
          aria-label="Misaligned garment"
        >
          <rect width="100%" height="100%" fill="var(--panel-2)" rx="8" />
          <g transform="translate(18 8) rotate(-7.5 100 90) scale(1.07)">
            <path
              d={DEMO_SHIRT_D}
              fill="#1e3a5f"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="1.2"
            />
          </g>
        </svg>
        <p className="pipeline-compare__tag pipeline-compare__tag--warn">
          Would score low confidence vs anchors
        </p>
      </div>

      <div className="pipeline-compare__card">
        <h3 className="pipeline-compare__title">Normalized (canonical space)</h3>
        <p className="pipeline-compare__sub">
          Same garment after affine warp + feather/shadow bake—the piece now
          swaps cleanly with other normalized shirts on the shared figure.
        </p>
        <svg
          viewBox="0 0 220 200"
          className="pipeline-compare__svg"
          role="img"
          aria-label="Aligned garment"
        >
          <rect width="100%" height="100%" fill="var(--panel-2)" rx="8" />
          <defs>
            <filter
              id="norm-soft"
              x="-25%"
              y="-25%"
              width="150%"
              height="150%"
            >
              <feDropShadow
                dx="0"
                dy="1.5"
                stdDeviation="1.2"
                floodColor="#000"
                floodOpacity="0.16"
              />
            </filter>
          </defs>
          <g transform="translate(78 36)" filter="url(#norm-soft)">
            <path
              d={DEMO_SHIRT_D}
              fill="#1e3a5f"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />
          </g>
        </svg>
        <p className="pipeline-compare__tag pipeline-compare__tag--ok">
          Ready for layered composite · consistent anchors
        </p>
      </div>
    </div>
  )
}
