import { useEffect, useRef, useState } from 'preact/hooks'
import '@fontsource/caveat-brush/latin-400.css'
import './about-animation.css'
import {
  CHAPTERS,
  createClock,
  FINAL_SENTENCE,
  playIntro,
  playOpening,
  TEMPO,
  type Chapter,
  type Scene,
} from './script.ts'
import { SceneView } from './views.tsx'

/**
 * - `idle`: the sentence alone. It is what the server renders, and all there
 *   is without JavaScript.
 * - `opening`: the sentence leaves as noise while the room for the stage
 *   opens.
 * - `playing`: the animated sequence, on the stage.
 *
 * The sentence stays in the page for screen readers throughout; its noise
 * and the stage are decorative.
 */
type Phase = 'idle' | 'opening' | 'playing'

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
  // What is left of the sentence while it leaves
  const [noise, setNoise] = useState('')
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
    const { signal } = controller
    const runSpeed = readSpeed() * TEMPO
    setSpeed(runSpeed)
    stop.current = () => controller.abort()

    // `phase` is what the page showed when the sequence was asked for. Asked
    // again while it plays, the stage is already there: it starts over at
    // once. Noise is not for someone who asked for less motion.
    const opens =
      phase !== 'playing' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const sequence = async () => {
      if (opens) {
        setPhase('opening')
        // Its own clock: `?from=` skips scenes, not the opening
        await playOpening(setNoise, createClock(signal, runSpeed))
      }
      setPhase('playing')
      await playIntro(setScene, createClock(signal, runSpeed, readFrom()))
    }

    sequence().then(
      () => setPhase('idle'),
      (error: unknown) => {
        // Stopped by "Skip", a new request or unmount: whoever stopped it
        // sets the phase.
        if (signal.aborted) return
        setPhase('idle')
        throw error
      },
    )

    return () => controller.abort()
    // Runs once per request: `phase` is only read as it was at that time
  }, [run])

  // The header link shows that the animation is playing
  useEffect(() => {
    const root = document.documentElement
    root.toggleAttribute('data-about-playing', phase !== 'idle')
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
      {phase === 'opening' && (
        <p class="aa-noise" aria-hidden="true">
          {noise}
        </p>
      )}
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
