import { useEffect, useState } from 'react'
import { preprocessGarment, type CleanGarment, type PreprocessOpts } from '../lib/imagePipeline'

export interface PipelineState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  shirt?: CleanGarment
  pants?: CleanGarment
  error?: string
  elapsedMs?: number
}

interface Args {
  shirtUrl: string
  shirtOpts?: PreprocessOpts
  pantsUrl: string
  pantsOpts?: PreprocessOpts
}

export function useGarmentPipeline({
  shirtUrl,
  shirtOpts,
  pantsUrl,
  pantsOpts,
}: Args): PipelineState {
  const [state, setState] = useState<PipelineState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    const t0 = performance.now()
    Promise.all([
      preprocessGarment(shirtUrl, shirtOpts),
      preprocessGarment(pantsUrl, pantsOpts),
    ])
      .then(([shirt, pants]) => {
        if (cancelled) return
        setState({
          status: 'ready',
          shirt,
          pants,
          elapsedMs: performance.now() - t0,
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
      })
    return () => {
      cancelled = true
    }
  }, [shirtUrl, pantsUrl, shirtOpts, pantsOpts])

  return state
}
