import { getPlaygroundUrl } from 'livecodes'
import {
  demoMarkup,
  demoParts,
  SCRIPT_LANGUAGES,
  type SnippetSource,
} from './snippetDemo.ts'

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
  const sources = (): SnippetSource[] =>
    fields.map((field) => ({
      language: field.dataset.language ?? '',
      code: field.value,
    }))

  const elsewhere =
    document.querySelector<HTMLAnchorElement>('.snippet-continue')
  const linkElsewhere = () => {
    if (elsewhere) {
      elsewhere.href = playgroundAddress(sources(), elsewhere.dataset.title)
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
 *
 * LiveCodes is open source and runs in the browser. Its own SDK builds the
 * address and puts the sources, compressed, in its fragment, the part of an
 * address that is not sent to the server: the code goes from this page to
 * the reader's playground and nowhere else.
 */
export function playgroundAddress(
  sources: SnippetSource[],
  title?: string,
): string {
  const { markup, css, js } = demoParts(sources)

  return getPlaygroundUrl({
    config: {
      ...(title ? { title } : {}),
      markup: { language: 'html', content: markup },
      style: { language: 'css', content: css },
      script: { language: 'javascript', content: js },
    },
  })
}
