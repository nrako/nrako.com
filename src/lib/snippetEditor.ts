import { getPlaygroundUrl } from 'livecodes'
import {
  demoMarkup,
  demoParts,
  SCRIPT_LANGUAGES,
  type SnippetSource,
} from './snippetDemo.ts'
import type { Highlight } from './snippetHighlight.ts'

/** How long the keys rest, in milliseconds, before the demo is drawn again */
const PAUSE = 250

/**
 * On a snippet's page asked for with `?source`: sets the sources of the
 * snippet in the page, each in a field, and draws the demo again from them as
 * they are edited.
 *
 * The demo is built by the rule the server follows (`snippetDemo.ts`), so an
 * edit shows what the post would. Nothing is kept: loading the page again
 * gives the snippet as written, and is also the way to be rid of what an
 * edited script left running. To keep an edit, the page links to LiveCodes
 * with the sources as they stand.
 *
 * A script that does not parse leaves the demo as it last worked, and one that
 * fails is said to on its pane: no more is shown of an error than that.
 *
 * The fields are coloured as code is in a post, once the highlighter is
 * fetched (`snippetHighlight.ts`).
 */
export function mountSnippetEditor() {
  if (!document.documentElement.hasAttribute('data-snippet-source')) return

  const template =
    document.querySelector<HTMLTemplateElement>('#snippet-editor')
  const editor = document.querySelector<HTMLElement>('.snippet-editor')
  const preview = document.querySelector<HTMLElement>('.snippet-preview')
  if (!template || !editor || !preview) return

  editor.append(template.content.cloneNode(true))
  const fields = [...editor.querySelectorAll('textarea')]
  // The console of the snippet, when it has one, under the sources
  const written = document.querySelector<HTMLElement>('.snippet-console pre')
  const sources = (): SnippetSource[] =>
    fields.map((field) => ({
      language: field.dataset.language ?? '',
      code: field.value,
    }))

  const elsewhere =
    document.querySelector<HTMLAnchorElement>('.snippet-continue')
  const linkElsewhere = () => {
    if (elsewhere) {
      elsewhere.href = playgroundAddress(sources(), {
        title: elsewhere.dataset.title,
        console: written !== null,
      })
    }
  }

  const isScript = (source: SnippetSource) =>
    SCRIPT_LANGUAGES.includes(source.language)
  const scriptFields = fields.filter((field) =>
    SCRIPT_LANGUAGES.includes(field.dataset.language ?? ''),
  )

  // Says on the script's panes that the script fails, and why: the name of
  // the pane takes the accent, and the reason is its title
  const report = (error?: string) => {
    for (const field of scriptFields) {
      const pane = field.closest<HTMLElement>('.snippet-pane')
      const marked = [pane?.querySelector('label'), field]

      pane?.toggleAttribute('data-error', error !== undefined)
      field.setAttribute('aria-invalid', String(error !== undefined))
      for (const element of marked) {
        if (error === undefined) element?.removeAttribute('title')
        else element?.setAttribute('title', error)
      }
    }
  }

  // A script that fails as it runs is reported too
  window.addEventListener('error', (event) => report(event.message))

  // The script as it last parsed. A line is not a script until it is finished:
  // while what is typed does not parse, the demo keeps this one, and goes on
  // working instead of dying at every keystroke.
  let working = sources().filter(isScript)

  const draw = () => {
    const typed = sources()
    const error = scriptError(demoParts(typed).js)
    report(error)
    if (error === undefined) working = typed.filter(isScript)

    preview.innerHTML =
      demoMarkup([
        ...typed.filter((source) => !isScript(source)),
        ...working,
      ]) ?? ''

    // The console is emptied: the page fills it with what the script writes
    // as it runs again
    if (written) written.textContent = ''

    // A script set through `innerHTML` does not run: each gives way to a new
    // one, which does
    for (const script of preview.querySelectorAll('script')) {
      const running = document.createElement('script')
      running.type = script.type
      running.textContent = script.textContent
      script.replaceWith(running)
    }

    linkElsewhere()
  }

  let pause: number | undefined
  for (const field of fields) {
    field.addEventListener('input', () => {
      // Edited as soon as a source differs from what was written: the link to
      // the playground then says what it is for (`global.css`)
      document.documentElement.toggleAttribute(
        'data-snippet-edited',
        fields.some((field) => field.value !== field.defaultValue),
      )

      window.clearTimeout(pause)
      pause = window.setTimeout(draw, PAUSE)
    })
  }

  report()
  linkElsewhere()

  // The colours come after the fields, which are edited without them: the
  // highlighter is most of what this page weighs, and is fetched apart. It
  // is asked for once the page has loaded, so that neither its fetch nor its
  // work is part of that load: WebKit holds the load of a page for a module
  // asked for before it.
  const colourFields = async () => {
    const { snippetHighlighter } = await import('./snippetHighlight.ts')
    const highlight = await snippetHighlighter()
    for (const field of fields) colour(field, highlight)
  }
  if (document.readyState === 'complete') colourFields()
  else window.addEventListener('load', colourFields, { once: true })
}

/**
 * Colours a field. A field cannot colour its own text, so the text is drawn a
 * second time, highlighted, over the field, whose own is no longer drawn
 * (`data-highlighted`, `global.css`): the field keeps the caret, the selection
 * and the keys, and what is read is the drawing.
 *
 * The drawing is made again as the field changes, before the next frame, and
 * moves as the field scrolls. It is moved, not scrolled: it would not scroll as far as
 * a field that has scrollbars. They are left out of its box, for the same
 * reason.
 */
function colour(field: HTMLTextAreaElement, highlight: Highlight) {
  const drawing = document.createElement('pre')
  drawing.className = 'snippet-highlight'
  drawing.setAttribute('aria-hidden', 'true')
  const code = drawing.appendChild(document.createElement('code'))

  const follow = () => {
    code.style.transform = `translate(${-field.scrollLeft}px, ${-field.scrollTop}px)`
    // What the field's box holds beside its content and its border, 1px a side
    drawing.style.right = `${field.offsetWidth - field.clientWidth - 2}px`
    drawing.style.bottom = `${field.offsetHeight - field.clientHeight - 2}px`
  }
  const draw = () => {
    code.innerHTML = highlight(field.value, field.dataset.language ?? '')
    follow()
  }

  // Once a frame at most, however many times the field changes before it: the
  // frame that shows a key is the one that shows it coloured
  let frame = 0
  field.addEventListener('input', () => {
    frame ||= requestAnimationFrame(() => {
      frame = 0
      draw()
    })
  })
  field.addEventListener('scroll', follow)
  new ResizeObserver(follow).observe(field)

  field.after(drawing)
  draw()
  field.parentElement?.toggleAttribute('data-highlighted', true)
}

/** The constructor of async functions, which has no name of its own */
const AsyncFunction = Object.getPrototypeOf(async () => undefined)
  .constructor as FunctionConstructor

/**
 * Why a script does not parse, or `undefined` when it does.
 *
 * It is parsed as the body of an async function, which is not run and takes
 * a top-level `await` as a module does. A script that imports or exports can
 * only be parsed by being run: it is taken as it is, and reported if it fails.
 */
export function scriptError(js: string): string | undefined {
  if (/^\s*(import|export)\b/m.test(js)) return undefined

  try {
    new AsyncFunction(js)
  } catch (error) {
    if (error instanceof SyntaxError) return error.message
    throw error
  }
  return undefined
}

/**
 * The address of a LiveCodes playground that opens with the given sources:
 * the markup, the CSS and the script of the demo, as the demo takes them.
 * With `console`, the playground opens with its own console shown, as the
 * snippet has one.
 *
 * LiveCodes is open source and runs in the browser. Its own SDK builds the
 * address and puts the sources, compressed, in its fragment, the part of an
 * address that is not sent to the server: the code goes from this page to
 * the reader's playground and nowhere else.
 */
export function playgroundAddress(
  sources: SnippetSource[],
  { title, console }: { title?: string; console?: boolean } = {},
): string {
  const { markup, css, js } = demoParts(sources)

  return getPlaygroundUrl({
    config: {
      ...(title ? { title } : {}),
      markup: { language: 'html', content: markup },
      style: { language: 'css', content: css },
      script: { language: 'javascript', content: js },
      ...(console ? { tools: { active: 'console', status: 'open' } } : {}),
    },
  })
}
