import { GARMENTS } from './data/realCatalog'
import { RealOutfitStage } from './components/RealOutfitStage'
import { PreprocessSteps } from './components/PreprocessSteps'
import { useGarmentPipeline } from './hooks/useGarmentPipeline'
import './App.css'

export default function App() {
  const pipeline = useGarmentPipeline({
    shirtUrl: GARMENTS.shirt.url,
    shirtOpts: GARMENTS.shirt.pipeline,
    pantsUrl: GARMENTS.pants.url,
    pantsOpts: GARMENTS.pants.pipeline,
  })

  return (
    <div className="app">
      <header className="app__header">
        <p className="app__eyebrow">
          Real-image pipeline · deterministic · no per-swap API
        </p>
        <h1 className="app__title">Outfit swap demo</h1>
        <p className="app__lede">
          One studio photo of a model. Two flat-lay garment photos from
          (simulated) sellers. Everything runs in the browser: background
          removal, alpha feathering, exposure match, then SVG composite with
          subtle drop shadow for grounding. Preprocessing happens once on
          load — every swap after that is a CSS-cheap re-render.
        </p>
      </header>

      <section className="section" aria-labelledby="sec-live">
        <h2 id="sec-live" className="section__title">
          Live composite
        </h2>
        <p className="section__desc">
          Click the figure or the tabs. Use the sliders to nudge alignment —
          this is the operator fallback for low-confidence uploads.
        </p>
        <RealOutfitStage />
      </section>

      <section className="section" aria-labelledby="sec-pipeline">
        <h2 id="sec-pipeline" className="section__title">
          Preprocessing pipeline (real images)
        </h2>
        <p className="section__desc">
          Same algorithm runs on every seller upload. The cleaned asset is
          cached and reused for the entire app life — including all variant
          tints, which are pure CSS filters at composite time.
        </p>
        <PreprocessSteps
          label="Shirt"
          garment={pipeline.shirt}
          loading={pipeline.status === 'loading'}
        />
        <PreprocessSteps
          label="Pants"
          garment={pipeline.pants}
          loading={pipeline.status === 'loading'}
        />
      </section>

      <section className="section" aria-labelledby="sec-algo">
        <h2 id="sec-algo" className="section__title">
          What the pipeline does
        </h2>
        <ol className="algo-list">
          <li>
            <strong>Border-aware chroma key.</strong> Median-sample the image
            border to estimate background colour, then per-pixel RGB distance
            with a soft inner/outer threshold gives a continuous alpha — no
            harsh cut-out look.
          </li>
          <li>
            <strong>Connected-component flood.</strong> Only kill background
            pixels reachable from the image border, so internal lights (a
            white tag on a black shirt, denim highlights) survive the cut.
          </li>
          <li>
            <strong>Premultiplied-alpha edge repair.</strong> Multiply RGB by
            alpha, box-blur both, unpremultiply — eliminates the white halo
            you get from a naive blur on transparent pixels.
          </li>
          <li>
            <strong>Tight crop.</strong> Snap to the non-transparent bbox so
            placement maths are stable across uploads of different framings.
          </li>
          <li>
            <strong>Exposure match.</strong> Scale luminance toward the model
            scene's mean — the garment stops reading as a sticker.
          </li>
          <li>
            <strong>Anchor + manual nudge.</strong> Garment scales to fit the
            anchor box on the model rig. Operator sliders cover the last 5%.
          </li>
          <li>
            <strong>SVG composite + drop shadow.</strong> Final overlay is an
            SVG <code>image</code> with an <code>feDropShadow</code> filter
            for soft grounding contact.
          </li>
        </ol>
      </section>

      <footer className="app__footer">
        <p>
          Stack: Vite + React + TypeScript. All processing in pure Canvas2D /
          Float32Array — works offline, deploys as a static bundle, scales
          linearly with catalog size.
        </p>
      </footer>
    </div>
  )
}
