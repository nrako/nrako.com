/**
 * The animated introduction, as a script: a sequence of scenes shown one
 * after the other, each a plain description of what is on screen. The views
 * in `views.tsx` render a scene; nothing here touches the DOM.
 */

/** How a run of text is drawn. */
export type Tone =
  /** Vim visual selection */
  | 'selected'
  /** Vim block cursor, on one character */
  | 'block'
  /** Text selected by another person on the shared board */
  | 'peer'
  /** Text a model predicts after the caret: greyed, with the key to accept */
  | 'ghost'
  /** The same prediction as it is turned down, with the key that does it */
  | 'refused'

export interface Seg {
  text: string
  tone?: Tone
  /** Index of the typeface the text is set in (scene 2); mono when absent */
  font?: number
  /** Draws the insertion caret right after the text */
  caret?: boolean
  /**
   * The completion list hangs right after this text, where the word being
   * typed starts, instead of following the caret
   */
  anchor?: boolean
}

export interface PopupItem {
  label: string
  /** Shown on the right of the line, dimmed */
  detail?: string
}

/**
 * Completion list anchored to the caret. It shows `POPUP_ROWS` lines and
 * scrolls to keep the selected one in view.
 */
export interface Popup {
  items: PopupItem[]
  selected: number
}

export const POPUP_ROWS = 3

/** Vim's last line: the mode or the command on the left, the keys on the right */
export interface Status {
  left: string
  right: string
  /** The left side is a command being typed: the caret follows it */
  caret?: boolean
  /** What follows the caret when the command is edited in its middle */
  tail?: string
}

export interface EditorScene {
  kind: 'editor'
  segs: Seg[]
  popup: Popup | null
  status: Status | null
  /**
   * What the last shell command printed, shown under the text. An empty
   * string keeps the line free for it; `null` leaves no room.
   */
  output: string | null
}

export interface CanvasScene {
  kind: 'canvas'
  /** The title component sits at the centre of its frame */
  snapped: boolean
  /** The centring guides are visible */
  guides: boolean
  /** The viewer's own hand, which drags the view */
  hand: 'off' | 'open' | 'grab'
  /** The view has moved from the design frame to the shared board */
  panned: boolean
  amin: 'off' | 'in' | 'word' | 'away' | 'fetch' | 'drop'
  dave: 'off' | 'in' | 'line' | 'draw'
  /** The title written on the board */
  title: Seg[]
  /**
   * The word Amin brings from the design frame and drops, askew, in front of
   * the title: held while it is carried, placed once it is let go
   */
  note: 'off' | 'held' | 'placed'
}

export interface PromptScene {
  kind: 'prompt'
  /** What is typed at the shell prompt to start the agent */
  command: string
  question: string
  /**
   * - `shell`: a shell prompt, where the agent's command is typed
   * - `typing`: the question is being typed on the agent's input line
   * - `sent`: the question is entered
   * - `thinking`: the model has not answered yet
   * - `answering`: the answer arrives word by word
   * - `done`: the answer is complete
   */
  phase: 'shell' | 'typing' | 'sent' | 'thinking' | 'answering' | 'done'
  /** The agent's own lines are on screen; they fold away when Vim takes over */
  agent: boolean
  answer: Seg[]
  status: Status | null
}

export type Scene = EditorScene | CanvasScene | PromptScene

/** The parts of the sequence, in order. A run can start from any of them. */
export const CHAPTERS = [
  'web',
  'frontend',
  'fullstack',
  'design',
  'board',
  'now',
  'prompt',
  'carve',
] as const
export type Chapter = (typeof CHAPTERS)[number]

export interface Clock {
  /** Resolves after `ms`, or rejects with an AbortError when the run stops */
  wait(ms: number): Promise<void>
  /** Tells the clock which part of the sequence begins */
  chapter(name: Chapter): void
}

/** Number of typefaces the title goes through in scene 2 (see the CSS) */
export const TYPEFACES = 3

const COMPLETIONS: PopupItem[] = [
  { label: 'Web Designer' },
  { label: 'Web/App Developer' },
  { label: 'Webmaster' },
]

/**
 * What "Fullstack" stands for. The list shows its first lines where the word
 * goes and closes as soon as the word starts: one word replaces picking one.
 */
const STACKS: PopupItem[] = [
  { label: 'TypeScript' },
  { label: 'Swift' },
  { label: '.NET C#' },
  { label: 'RoR' },
  { label: 'Django' },
  { label: 'JavaScript' },
  { label: 'PHP' },
  { label: 'OCaml' },
  { label: 'Python' },
]

/** What the work was for, in order, with the year each began */
const DOMAINS: PopupItem[] = [
  { label: 'Soft Dev Shop', detail: '2007' },
  { label: 'Brand/Identity Soft', detail: '2009' },
  { label: 'Social Network', detail: '2012' },
  { label: 'VoIP', detail: '2013' },
  { label: 'Electric Mobility', detail: '2020' },
]
/** How long each line of `DOMAINS` stays selected: it speeds up, then rests */
const DOMAIN_HOLDS = [420, 300, 270, 240, 520]

/**
 * The model's answer, written backwards from the words that must survive:
 * `kept` is carved out of it with two deletions. The first takes the model's
 * verb, "pilot", with everything before it.
 */
const ANSWER = {
  before:
    'In the AI era, your role is to leverage cutting-edge tools to pilot ',
  kept: 'what is worth building',
  after: ', and to empower teams to unlock seamless value.',
}

/** What the author writes in front of the kept words: their own verb */
const OWN_VERB = 'I decide'

/** Typed by hand once the answer is carved: the model has no part in it */
const OWN_WORDS = 'Opinions below.'

/** The carved answer with the author's verb, made a sentence */
const CARVED = `${OWN_VERB} ${ANSWER.kept}.`

/** What is on the page when the introduction is not playing */
export const FINAL_SENTENCE = `${CARVED} ${OWN_WORDS}`

const QUESTION = "What's my role now?"

/** How the sentence about the present starts, typed by hand */
const NOW = 'Now I am '
/** What a model predicts next, the titles in fashion; it is turned down */
const FASHIONS = 'a Prompt Engineer, AI Whisperer aka Vibe Coder'

/**
 * The transition's command line: count the skills gathered over the years,
 * then count again through a filter.
 */
const SKILLS = ':!ls ~/skills | '
const COUNT = 'wc -l'
const FILTER = 'grep amana | '
const SKILLS_COUNT = '360'
const SKILLS_KEPT = '3'

/** The file opened for what comes next, and written when the sequence ends */
const NEW_FILE = 'now.md'

/** The command that starts the agent, typed in a shell opened from Vim */
const AGENT = 'agent'

/**
 * Overall pace. Every duration in the script and every CSS transition is
 * divided by it: below 1 is slower than the durations as written.
 */
export const TEMPO = 0.75

/** Milliseconds per keystroke: someone who types for a living */
const KEY = 42
/**
 * Milliseconds per word of the model's answer. In real time: multiplied by
 * the tempo so that the tempo does not change it.
 */
const WORD = 70 * TEMPO

/**
 * With `from`, the clock does not wait until that chapter begins: the script
 * runs through what comes before in no time, which builds the state the
 * chapter starts from without showing it.
 */
export function createClock(
  signal: AbortSignal,
  speed = 1,
  from?: Chapter,
): Clock {
  let skipping = from !== undefined
  return {
    chapter(name) {
      if (name === from) skipping = false
    },
    wait(ms) {
      return new Promise((resolve, reject) => {
        if (signal.aborted) {
          reject(signal.reason)
          return
        }
        if (skipping) {
          resolve()
          return
        }
        const onAbort = () => {
          clearTimeout(timer)
          reject(signal.reason)
        }
        const timer = setTimeout(() => {
          signal.removeEventListener('abort', onAbort)
          resolve()
        }, ms / speed)
        signal.addEventListener('abort', onAbort, { once: true })
      })
    },
  }
}

/**
 * Plays the introduction once. Resolves when the last scene is over; rejects
 * with the clock's AbortError when the run is stopped.
 *
 * A pause that follows a change the CSS animates (the snap, the move to the
 * board, the underline) must outlast that transition.
 */
export async function playIntro(
  show: (scene: Scene) => void,
  clock: Clock,
): Promise<void> {
  const { wait } = clock

  /** Calls `onText` with one more character of `text` at each step */
  async function type(
    text: string,
    onText: (typed: string) => void,
    delay = KEY,
  ) {
    for (let i = 1; i <= text.length; i++) {
      onText(text.slice(0, i))
      await wait(delay)
    }
  }

  /** Types a Vim command on the last line */
  async function command(
    text: string,
    render: (status: Status) => void,
    delay = 110,
    pause = 450,
  ) {
    await type(
      text,
      (typed) => render({ left: typed, right: '', caret: true }),
      delay,
    )
    await wait(pause)
  }

  // --- 1. Web developer: an editor that completes the word -----------------
  clock.chapter('web')

  let editor: EditorScene = {
    kind: 'editor',
    segs: [{ text: '', caret: true }],
    popup: null,
    status: null,
    output: null,
  }
  const edit = (patch: Partial<EditorScene>) => {
    editor = { ...editor, ...patch }
    show(editor)
  }
  const line = (text: string) => edit({ segs: [{ text, caret: true }] })

  edit({})
  await wait(400)
  await type('I was a ', line)
  await type('Web', (typed) => line(`I was a ${typed}`))
  edit({ popup: { items: COMPLETIONS, selected: 0 } })
  // Slower: the eye is on the list
  await type('/App', (typed) => line(`I was a Web${typed}`), 70)
  await wait(220)
  edit({ popup: { items: COMPLETIONS, selected: 1 } })
  await wait(420)
  edit({ popup: null })
  line('I was a Web/App Developer')
  await wait(450)

  // --- 2. Frontend developer: the same sentence, set in several typefaces --
  clock.chapter('frontend')

  const past = 'I was a Web/App Developer... at times a '
  await type('... at times a ', (typed) =>
    line(`I was a Web/App Developer${typed}`),
  )
  await type('Frontend Developer', (typed) => line(past + typed))
  await wait(250)
  for (let font = 0; font < TYPEFACES; font++) {
    edit({
      segs: [{ text: past }, { text: 'Frontend Developer', font, caret: true }],
    })
    await wait(300)
  }
  line(`${past}Frontend Developer`)
  await wait(350)

  // --- 3. Fullstack developer: Vim replaces the word, then `:q!` -----------
  // Paced for someone who does not read Vim: each step holds long enough to
  // be seen before the next one moves the eye.
  clock.chapter('fullstack')

  const vim = (segs: Seg[], left: string, right: string) =>
    edit({ segs: [{ text: past }, ...segs], status: { left, right } })

  vim([{ text: 'F', tone: 'block' }, { text: 'rontend Developer' }], '', '')
  await wait(650)
  vim(
    [{ text: 'F', tone: 'selected' }, { text: 'rontend Developer' }],
    '-- VISUAL --',
    'v',
  )
  await wait(450)
  vim(
    [{ text: 'Frontend', tone: 'selected' }, { text: ' Developer' }],
    '-- VISUAL --',
    've',
  )
  await wait(750)
  // The stacks are on offer where the word goes. None is picked: one word
  // is typed for all of them.
  const stacks = (typed: string, right: string) =>
    edit({
      segs: [
        { text: past, anchor: true },
        { text: typed, caret: true },
        { text: ' Developer' },
      ],
      status: { left: '-- INSERT --', right },
      // Gone once a few letters are typed: nothing in it starts with them
      popup: typed.length < 3 ? { items: STACKS, selected: -1 } : null,
    })
  stacks('', 'c')
  await wait(400)
  await type('Fullstack', (typed) => stacks(typed, ''), 60)
  await wait(450)
  vim(
    [
      { text: 'Fullstac' },
      { text: 'k', tone: 'block' },
      { text: ' Developer' },
    ],
    '',
    '',
  )
  await wait(400)

  // What it was for: the list scrolls through the years, and nothing is kept
  const title = 'Fullstack Developer'
  vim([{ text: title, caret: true }], '-- INSERT --', 'A')
  await wait(300)
  await type(' for ', (typed) =>
    vim([{ text: title + typed, caret: true }], '-- INSERT --', ''),
  )
  for (const [selected, hold] of DOMAIN_HOLDS.entries()) {
    edit({
      popup: { items: DOMAINS, selected },
      status: { left: '-- INSERT --', right: '^N' },
    })
    await wait(hold)
  }
  edit({ popup: null, status: { left: '-- INSERT --', right: '^E' } })
  await wait(300)
  vim(
    [{ text: title.slice(0, -1) }, { text: title.slice(-1), tone: 'block' }],
    '',
    'u',
  )
  await wait(500)
  // Nothing was kept, so there is nothing to write
  await command(':q!', (status) => edit({ status }))

  // --- 4. Product technical design: the canvas was underneath --------------
  clock.chapter('design')

  let canvas: CanvasScene = {
    kind: 'canvas',
    snapped: false,
    guides: false,
    hand: 'off',
    panned: false,
    amin: 'off',
    dave: 'off',
    title: [{ text: 'Project Management' }],
    note: 'off',
  }
  const draw = (patch: Partial<CanvasScene>) => {
    canvas = { ...canvas, ...patch }
    show(canvas)
  }

  draw({})
  await wait(600)
  draw({ snapped: true, guides: true })
  await wait(1150)
  draw({ guides: false })
  await wait(250)

  // --- 4 → 5. The hand drags the view to the shared board ------------------
  clock.chapter('board')

  draw({ hand: 'open' })
  await wait(280)
  draw({ hand: 'grab' })
  await wait(180)
  draw({ panned: true })
  await wait(1080)
  // Let go, then leave
  draw({ hand: 'open' })
  await wait(200)
  draw({ hand: 'off' })
  await wait(150)

  // --- 5. Project, then product management: the others rewrite the title ---

  draw({ amin: 'in' })
  await wait(250)
  draw({ dave: 'in' })
  await wait(500)
  draw({ amin: 'word' })
  await wait(600)
  draw({ title: [{ text: 'Project', tone: 'peer' }, { text: ' Management' }] })
  await wait(350)
  await type('Product', (typed) =>
    draw({ title: [{ text: typed, caret: true }, { text: ' Management' }] }),
  )
  await wait(200)
  draw({ title: [{ text: 'Product Management' }], amin: 'away' })
  await wait(150)
  draw({ dave: 'line' })
  await wait(580)
  draw({ dave: 'draw' })
  await wait(1050)
  // An afterthought more than a title: "(Technical)", dropped askew
  draw({ amin: 'fetch' })
  await wait(600)
  draw({ amin: 'drop', note: 'held' })
  await wait(650)
  draw({ note: 'placed' })
  await wait(250)
  draw({ amin: 'away' })
  await wait(900)

  // --- Transition. The list has titles again, the ones in fashion, and none
  // is taken. The command line counts the skills of all those years, counts
  // them again through a filter, and a new file is opened for what comes next.
  clock.chapter('now')

  edit({ popup: null, status: null, output: '' })
  line('')
  await wait(500)
  // Slower: a sentence being worked out, not recalled
  await type(NOW, line, 60)
  await wait(300)
  edit({
    segs: [
      { text: NOW, caret: true },
      { text: FASHIONS, tone: 'ghost' },
    ],
  })
  // Long enough to read it, and to consider it
  await wait(1125)
  edit({
    segs: [
      { text: NOW, caret: true },
      { text: FASHIONS, tone: 'refused' },
    ],
    status: { left: '-- INSERT --', right: 'Esc' },
  })
  await wait(350)
  edit({ segs: [{ text: NOW, caret: true }] })
  await wait(300)
  edit({ segs: [{ text: NOW }] })

  await command(SKILLS + COUNT, (status) => edit({ status }), 50, 150)
  edit({ status: { left: SKILLS + COUNT, right: '' }, output: SKILLS_COUNT })
  await wait(550)
  // The same command recalled, and a filter typed into it
  edit({ status: { left: SKILLS, caret: true, tail: COUNT, right: '↑' } })
  await wait(250)
  await type(
    FILTER,
    (typed) =>
      edit({
        status: { left: SKILLS + typed, caret: true, tail: COUNT, right: '' },
      }),
    45,
  )
  await wait(150)
  edit({
    status: { left: SKILLS + FILTER + COUNT, right: '' },
    output: SKILLS_KEPT,
  })
  await wait(900)

  await command(`:e ${NEW_FILE}`, (status) => edit({ status }), 60, 250)
  edit({
    segs: [{ text: ' ', tone: 'block' }],
    status: { left: `"${NEW_FILE}" [New]`, right: '' },
    output: '',
  })
  await wait(500)
  // Out to a shell, without leaving Vim for good
  await command(':sh', (status) => edit({ status }), 70, 150)

  // --- 6a. The agent, started from the shell: it unrolls a generic answer --
  clock.chapter('prompt')

  let prompt: PromptScene = {
    kind: 'prompt',
    command: '',
    question: '',
    phase: 'shell',
    agent: true,
    answer: [],
    status: null,
  }
  const ask = (patch: Partial<PromptScene>) => {
    prompt = { ...prompt, ...patch }
    show(prompt)
  }

  ask({})
  await wait(250)
  await type(AGENT, (command) => ask({ command }), 60)
  await wait(200)
  ask({ phase: 'typing' })
  await wait(350)
  await type(QUESTION, (question) => ask({ question }))
  await wait(300)
  ask({ phase: 'sent' })
  await wait(250)
  ask({ phase: 'thinking' })
  await wait(1300)
  const answer = ANSWER.before + ANSWER.kept + ANSWER.after
  const words = answer.split(' ')
  for (let i = 1; i <= words.length; i++) {
    ask({ phase: 'answering', answer: [{ text: words.slice(0, i).join(' ') }] })
    await wait(WORD)
  }
  ask({ phase: 'done' })
  await wait(700)

  // --- 6b. Vim comes back and carves the sentence out of the answer --------
  clock.chapter('carve')

  const carve = (segs: Seg[], left: string, right: string) =>
    ask({ answer: segs, status: { left, right } })
  const rest = ANSWER.kept + ANSWER.after

  // The agent's lines fold away: what is left is a text being edited
  ask({ answer: [{ text: answer }], agent: false })
  await wait(450)
  carve([{ text: answer[0], tone: 'block' }, { text: answer.slice(1) }], '', '')
  await wait(380)
  // First selection, extended word by word up to the sentence to keep
  const beforeWords = ANSWER.before.trimEnd().split(' ')
  for (let i = 1; i <= beforeWords.length; i++) {
    const selected = beforeWords.slice(0, i).join(' ') + ' '
    carve(
      [
        { text: selected, tone: 'selected' },
        { text: answer.slice(selected.length) },
      ],
      '-- VISUAL --',
      'v',
    )
    await wait(35)
  }
  await wait(350)
  carve([{ text: rest[0], tone: 'block' }, { text: rest.slice(1) }], '', 'd')
  await wait(350)
  carve(
    [
      { text: ANSWER.kept },
      { text: ANSWER.after[0], tone: 'block' },
      { text: ANSWER.after.slice(1) },
    ],
    '',
    '',
  )
  await wait(280)
  carve(
    [{ text: ANSWER.kept }, { text: ANSWER.after, tone: 'selected' }],
    '-- VISUAL --',
    'v$',
  )
  await wait(400)
  carve(
    [
      { text: ANSWER.kept.slice(0, -1) },
      { text: ANSWER.kept.slice(-1), tone: 'block' },
    ],
    '',
    'd',
  )
  await wait(350)
  // Two insertions make it a sentence. In front, the verb: the model's went
  // with the first deletion, this one is the author's.
  await type(
    `${OWN_VERB} `,
    (typed) =>
      carve(
        [{ text: typed, caret: true }, { text: ANSWER.kept }],
        '-- INSERT --',
        'I',
      ),
    90,
  )
  await wait(250)
  // At the end, a full stop. The words that follow are the author's too.
  carve(
    [{ text: `${OWN_VERB} ${ANSWER.kept}`, caret: true }],
    '-- INSERT --',
    'A',
  )
  await wait(180)
  carve([{ text: CARVED, caret: true }], '-- INSERT --', '')
  await wait(320)
  await type(` ${OWN_WORDS}`, (typed) =>
    carve([{ text: CARVED + typed, caret: true }], '-- INSERT --', ''),
  )
  await wait(320)
  carve([{ text: FINAL_SENTENCE }], '', '')
  await wait(350)
  await command(':wq', (status) => ask({ status }))
  // The file opened at the transition now holds the sentence
  const bytes = FINAL_SENTENCE.length + 1
  ask({ status: { left: `"${NEW_FILE}" 1L, ${bytes}B written`, right: '' } })
  await wait(600)
}
