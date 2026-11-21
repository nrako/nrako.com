import { useEffect, useRef, useState } from 'preact/hooks'
import '@fontsource/caveat-brush/latin-400.css'
import './about-animation.css'
import {
  CHAPTERS,
  createClock,
  FINAL_SENTENCE,
  playIntro,
  TEMPO,
  type Chapter,
  type Scene,
} from './script.ts'
import { SceneView } from './views.tsx'

/**
 * - `idle`: the sentence alone. It is what the server renders, and all there
 *   is without JavaScript.
 * - `playing`: the animated sequence. The sentence stays in the page for
 *   screen readers; the stage is decorative.
 */
type Phase = 'idle' | 'playing'

/**
 * The introduction never plays on its own. A link to this anchor on the same
 * page plays it from the start, and so does arriving on the page with the
 * anchor in the address.
 */
const ANCHOR = 'about'

/**
 * Tuning aid: `?speed=2` plays twice as fast, `?speed=0.5` at half speed,
 * both relative to the script's tempo.
 */
function readSpeed(): number {
  const speed = Number(new URLSearchParams(location.search).get('speed'))
  return Number.isFinite(speed) && speed > 0 ? Math.min(speed, 100) : 1
}

/**
 * Tuning aid: `?from=prompt` starts the sequence at that chapter instead of
 * the beginning. See `CHAPTERS` for the names.
 */
function readFrom(): Chapter | undefined {
  const from = new URLSearchParams(location.search).get('from')
  return CHAPTERS.find((chapter) => chapter === from)
}

export default function AboutAnimation() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [scene, setScene] = useState<Scene | null>(null)
  const [speed, setSpeed] = useState(1)
  // Number of times the sequence was asked for; each request restarts it.
  const [run, setRun] = useState(0)
  const stop = useRef<(() => void) | null>(null)

  useEffect(() => {
    const play = () => setRun((run) => run + 1)

    const onClick = (event: MouseEvent) => {
      // Leave "open in a new tab" and the like to the browser
      if (event.button !== 0 || event.metaKey || event.ctrlKey) return
      if (event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest('a')
      if (!link || link.hash !== `#${ANCHOR}`) return
      if (link.origin !== location.origin) return
      if (link.pathname !== location.pathname) return
      // The anchor stays out of the address: reloading does not replay.
      event.preventDefault()
      play()
    }
    document.addEventListener('click', onClick)

    if (location.hash === `#${ANCHOR}`) {
      history.replaceState(null, '', location.pathname + location.search)
      play()
    }

    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    if (run === 0) return

    const controller = new AbortController()
    const runSpeed = readSpeed() * TEMPO
    setSpeed(runSpeed)
    setPhase('playing')
    stop.current = () => controller.abort()

    const clock = createClock(controller.signal, runSpeed, readFrom())
    playIntro(setScene, clock).then(
      () => setPhase('idle'),
      (error: unknown) => {
        // Stopped by "Skip", a new request or unmount: whoever stopped it
        // sets the phase.
        if (controller.signal.aborted) return
        setPhase('idle')
        throw error
      },
    )

    return () => controller.abort()
  }, [run])

  // The header link shows that the animation is playing
  useEffect(() => {
    const root = document.documentElement
    root.toggleAttribute('data-about-playing', phase === 'playing')
    return () => root.removeAttribute('data-about-playing')
  }, [phase])

  const skip = () => {
    stop.current?.()
    setPhase('idle')
  }

  return (
    <div
      id={ANCHOR}
      class="about-animation"
      data-phase={phase}
      data-played={run > 0 ? '' : undefined}
      style={{ '--aa-speed': speed }}
    >
      <p class="aa-sentence">{FINAL_SENTENCE}</p>
      {phase === 'playing' && scene && (
        <>
          <div class="aa-stage" aria-hidden="true">
            <SceneView key={scene.kind} scene={scene} />
          </div>
          <p class="aa-controls">
            <button type="button" onClick={skip}>
              Skip
            </button>
          </p>
        </>
      )}
    </div>
  )
}
