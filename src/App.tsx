import { OutfitStage } from './components/OutfitStage'
import { PipelineCompare } from './components/PipelineCompare'
import { AlignmentPlayground } from './components/AlignmentPlayground'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <p className="app__eyebrow">Client concept · layered swap + pipeline</p>
        <h1 className="app__title">Outfit swap demo</h1>
        <p className="app__lede">
          Deterministic viewer: layered figure, clickable regions, crossfades only
          (no per-swap APIs). Below, a before/after for <strong>normalization</strong>{' '}
          and a <strong>manual nudge</strong> control for low-confidence uploads.
        </p>
      </header>

      <section className="section" aria-labelledby="sec-live">
        <h2 id="sec-live" className="section__title">
          Live interactive outfit
        </h2>
        <p className="section__desc">
          Click the figure or the chips. Transitions are pure client opacity
          fades—same pattern you would use with preprocessed transparent PNGs
          snapped to canonical anchors.
        </p>
        <OutfitStage />
      </section>

      <section className="section" aria-labelledby="sec-pipeline">
        <h2 id="sec-pipeline" className="section__title">
          Multi-seller consistency (simulated)
        </h2>
        <p className="section__desc">
          In production, misaligned cutouts are warped into a shared template
          (keypoints + affine or homography). The viewer only ever composites
          already-normalized layers.
        </p>
        <PipelineCompare />
      </section>

      <section className="section" aria-labelledby="sec-align">
        <h2 id="sec-align" className="section__title">
          Operator fallback
        </h2>
        <AlignmentPlayground />
      </section>

      <footer className="app__footer">
        <p>
          Demo stack: Vite + React · SVG layering · CSS transitions. Swap assets
          for dressed PNGs keyed to your rig—architecture stays identical.
        </p>
      </footer>
    </div>
  )
}
