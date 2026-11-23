import { demoMarkup } from './snippetDemo.ts'

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
 * edited script left running.
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

  const draw = () => {
    preview.innerHTML =
      demoMarkup(
        fields.map((field) => ({
          language: field.dataset.language ?? '',
          code: field.value,
        })),
      ) ?? ''

    // A script set through `innerHTML` does not run: each gives way to a new
    // one, which does
    for (const script of preview.querySelectorAll('script')) {
      const running = document.createElement('script')
      running.type = script.type
      running.textContent = script.textContent
      script.replaceWith(running)
    }
  }

  let pause: number | undefined
  for (const field of fields) {
    field.addEventListener('input', () => {
      window.clearTimeout(pause)
      pause = window.setTimeout(draw, PAUSE)
    })
  }
}
