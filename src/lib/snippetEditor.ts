import { getPlaygroundUrl } from 'livecodes'
import { demoMarkup, demoParts, type SnippetSource } from './snippetDemo.ts'

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

  const draw = () => {
    preview.innerHTML = demoMarkup(sources()) ?? ''

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
      window.clearTimeout(pause)
      pause = window.setTimeout(draw, PAUSE)
    })
  }

  linkElsewhere()
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
