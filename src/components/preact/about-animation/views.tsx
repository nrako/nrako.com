import { Fragment } from 'preact'
import { useLayoutEffect, useRef } from 'preact/hooks'
import {
  POPUP_ROWS,
  type CanvasScene,
  type EditorScene,
  type Popup,
  type PromptScene,
  type Scene,
  type Seg,
  type Status,
} from './script.ts'

/**
 * The marker underline: one stroke to the right, back along itself, then a
 * scribble that shrinks. In CSS pixels: the same path draws the SVG stroke
 * and guides the cursor that draws it, so the SVG must not be scaled.
 */
const UNDERLINE =
  'M5,8 C93,11 187,8 275,7 C236,7 187,9 151,11 L74,16 L149,14 L111,22 L141,24 Q147,26 148,31'

export function SceneView({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case 'editor':
      return <EditorView scene={scene} />
    case 'canvas':
      return <CanvasView scene={scene} />
    case 'prompt':
      return <PromptView scene={scene} />
  }
}

function Text({ segs, popup }: { segs: Seg[]; popup?: Popup | null }) {
  // The list follows the caret unless a segment anchors it
  const anchored = segs.some((seg) => seg.anchor)
  return (
    <>
      {segs.map((seg, index) => (
        <Fragment key={index}>
          <span class={segClass(seg)}>{seg.text}</span>
          {seg.anchor && popup && (
            <span class="aa-anchor">
              <Completions popup={popup} />
            </span>
          )}
          {seg.caret && (
            <span class="aa-caret">
              {popup && !anchored && <Completions popup={popup} />}
            </span>
          )}
        </Fragment>
      ))}
    </>
  )
}

function segClass(seg: Seg): string | undefined {
  const classes = []
  if (seg.tone) classes.push(`aa-${seg.tone}`)
  if (seg.font !== undefined) classes.push(`aa-font aa-font-${seg.font}`)
  return classes.length > 0 ? classes.join(' ') : undefined
}

/** The completion list, anchored to the caret and kept inside the stage */
function Completions({ popup }: { popup: Popup }) {
  const ref = useRef<HTMLSpanElement>(null)

  // The caret can sit near the right edge once the sentence wraps: shift the
  // list left by whatever would stick out.
  useLayoutEffect(() => {
    const list = ref.current
    const stage = list?.closest('.aa-stage')
    if (!list || !stage) return
    list.style.translate = ''
    const overflow =
      list.getBoundingClientRect().right - stage.getBoundingClientRect().right
    if (overflow > 0) list.style.translate = `${-overflow}px 0`
  })

  // The list scrolls only as far as needed to keep the selected line in view
  const count = popup.items.length
  const hidden = Math.max(0, count - POPUP_ROWS)
  const top = Math.min(hidden, Math.max(0, popup.selected - POPUP_ROWS + 1))

  return (
    <span
      class="aa-popup"
      ref={ref}
      style={{ '--aa-rows': Math.min(count, POPUP_ROWS), '--aa-top': top }}
    >
      <span class="aa-popup-window">
        <span class="aa-popup-list">
          {popup.items.map((item, index) => (
            <span
              class="aa-popup-item"
              data-selected={index === popup.selected ? '' : undefined}
            >
              {item.label}
              {item.detail && (
                <span class="aa-popup-detail">{item.detail}</span>
              )}
            </span>
          ))}
        </span>
        {hidden > 0 && (
          <span class="aa-popup-bar">
            <span
              class="aa-popup-thumb"
              style={{
                height: `${(POPUP_ROWS / count) * 100}%`,
                top: `${(top / count) * 100}%`,
              }}
            />
          </span>
        )}
      </span>
    </span>
  )
}

/** Vim's last line. Always rendered so the scene keeps its height. */
function StatusLine({ status }: { status: Status | null }) {
  return (
    <div class="aa-status font-mono" data-on={status ? '' : undefined}>
      <span>
        {status?.left}
        {status?.caret && <span class="aa-caret" />}
        {status?.tail}
      </span>
      <span>{status?.right}</span>
    </div>
  )
}

function EditorView({ scene }: { scene: EditorScene }) {
  return (
    <div class="aa-scene aa-editor font-mono">
      <p class="aa-buffer">
        <Text segs={scene.segs} popup={scene.popup} />
      </p>
      {scene.output !== null && <p class="aa-output">{scene.output}</p>}
      <StatusLine status={scene.status} />
    </div>
  )
}

function CanvasView({ scene }: { scene: CanvasScene }) {
  const flag = (on: boolean) => (on ? '' : undefined)
  return (
    <div
      class="aa-scene aa-canvas"
      data-snapped={flag(scene.snapped)}
      data-guides={flag(scene.guides)}
      data-panned={flag(scene.panned)}
      data-hand={scene.hand}
      data-amin={scene.amin}
      data-dave={scene.dave}
      data-note={scene.note}
    >
      <div class="aa-world">
        <div class="aa-zone">
          <div class="aa-frame-wrap">
            <div class="aa-frame-label">I also did...</div>
            <div class="aa-frame bg-white dark:bg-black">
              <i class="aa-guide aa-guide-v" />
              <i class="aa-guide aa-guide-h" />
              <div class="aa-component">
                Product Technical Design
                <i class="aa-handle aa-handle-nw" />
                <i class="aa-handle aa-handle-ne" />
                <i class="aa-handle aa-handle-sw" />
                <i class="aa-handle aa-handle-se" />
              </div>
            </div>
            <FlowBefore />
            <FlowAfter />
          </div>
        </div>
        <div class="aa-zone aa-board">
          <div class="aa-board-inner">
            <div class="aa-marker">
              <Text segs={scene.title} />
            </div>
            <svg class="aa-underline" width="280" height="36">
              <path d={UNDERLINE} pathLength={1} />
            </svg>
            <span class="aa-note">(Technical)</span>
            <Cursor who="amin" name="Amin" />
            <Cursor who="dave" name="Dave" path={UNDERLINE} />
          </div>
        </div>
      </div>
      <Hand />
    </div>
  )
}

/**
 * The screen that leads to the design frame, as a wireframe, and its link.
 * Drawn 112 by 72: the frame's height, and a gap of 20 for the link.
 */
function FlowBefore() {
  return (
    <svg class="aa-flow aa-flow-before" viewBox="0 0 112 72">
      <g class="aa-wire">
        <rect class="aa-wire-frame" x="0.5" y="0.5" width="91" height="71" />
        <rect x="8" y="8" width="34" height="30" />
        <path d="M8 8 42 38M42 8 8 38" />
        <rect x="48" y="10" width="36" height="4" rx="2" />
        <rect x="48" y="19" width="28" height="4" rx="2" />
        <rect x="48" y="29" width="24" height="9" rx="4.5" />
        <rect x="8" y="46" width="22" height="18" />
        <rect x="35" y="46" width="22" height="18" />
        <rect x="62" y="46" width="22" height="18" />
      </g>
      <g class="aa-link">
        <path d="M92 36H111M107 32.5 111.5 36 107 39.5" />
        <circle cx="92" cy="36" r="2.5" />
      </g>
    </svg>
  )
}

/** The link out of the design frame and the screen it leads to */
function FlowAfter() {
  return (
    <svg class="aa-flow aa-flow-after" viewBox="0 0 112 72">
      <g class="aa-wire">
        <rect class="aa-wire-frame" x="20.5" y="0.5" width="91" height="71" />
        <rect x="28" y="8" width="76" height="12" />
        <rect x="28" y="25" width="76" height="12" />
        <rect x="28" y="42" width="76" height="12" />
        <circle cx="34" cy="14" r="2.5" />
        <circle cx="34" cy="31" r="2.5" />
        <circle cx="34" cy="48" r="2.5" />
        <rect x="80" y="59" width="24" height="8" rx="4" />
      </g>
      <g class="aa-link">
        <path d="M0 36H19M15 32.5 19.5 36 15 39.5" />
        <circle cx="0" cy="36" r="2.5" />
      </g>
    </svg>
  )
}

function Cursor({
  who,
  name,
  path,
}: {
  who: string
  name: string
  path?: string
}) {
  return (
    <span class={`aa-cursor aa-${who}`}>
      <span
        class="aa-pen"
        style={path ? { offsetPath: `path('${path}')` } : undefined}
      >
        <svg viewBox="0 0 14 18" width="14" height="18">
          <path
            d="M1 1 L1 14 L4.6 10.8 L7.2 16.6 L9.6 15.5 L7 9.8 L12 9.8 Z"
            fill="currentColor"
            stroke="#fff"
            stroke-width="1"
            stroke-linejoin="round"
          />
        </svg>
        <span class="aa-cursor-name">{name}</span>
      </span>
    </span>
  )
}

function Hand() {
  return (
    <svg class="aa-hand" viewBox="0 0 20 20" width="22" height="22">
      <path
        d="M5 9.4V6.5a1.5 1.5 0 0 1 3 0V5.2a1.5 1.5 0 0 1 3 0v1a1.5 1.5 0 0 1 3 0v1.2a1.5 1.5 0 0 1 3 0V12a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.2-3L3 11.6a1.4 1.4 0 0 1 2-1.8Z"
        fill="#fff"
        stroke="#000"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
    </svg>
  )
}

/** A terminal spinner: braille frames shown one at a time */
const SPINNER_FRAMES = [...'⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏']

function Spinner() {
  return (
    <span class="aa-spinner">
      <span class="aa-spinner-frames">
        {SPINNER_FRAMES.map((frame) => (
          <span>{frame}</span>
        ))}
      </span>
    </span>
  )
}

function PromptView({ scene }: { scene: PromptScene }) {
  if (scene.phase === 'shell') {
    return (
      <div class="aa-scene aa-prompt font-mono" data-phase="shell">
        <p class="aa-shell">
          <span class="aa-agent-mark">$</span>
          {scene.command}
          <span class="aa-agent-cursor" />
        </p>
      </div>
    )
  }

  const typing = scene.phase === 'typing'
  return (
    <div
      class="aa-scene aa-prompt font-mono"
      data-phase={scene.phase}
      data-agent={scene.agent ? '' : undefined}
    >
      {/* Entered, the question is a line of the transcript */}
      <div class="aa-prompt-fold" data-open={scene.agent ? '' : undefined}>
        <div class="aa-prompt-fold-inner">
          {!typing && (
            <p class="aa-agent-asked">
              <span class="aa-agent-mark">❯</span>
              {scene.question}
            </p>
          )}
        </div>
      </div>
      {scene.phase === 'thinking' && (
        <p class="aa-busy">
          <Spinner />
          Thinking…
        </p>
      )}
      <p class="aa-answer">
        <Text segs={scene.answer} />
      </p>
      {/* The agent's input line, at the bottom of its screen */}
      <div
        class="aa-prompt-fold aa-agent-bar"
        data-open={scene.agent ? '' : undefined}
      >
        <div class="aa-prompt-fold-inner">
          <p class="aa-agent-input">
            <span class="aa-agent-mark">❯</span>
            {typing && scene.question}
            <span class="aa-agent-cursor" />
          </p>
        </div>
      </div>
      <StatusLine status={scene.status} />
    </div>
  )
}
