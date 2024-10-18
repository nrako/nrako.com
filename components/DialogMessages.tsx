import type { Messages } from '../utils/processor.ts'

export default function DialogMessages(
  { messages }: { messages: Messages },
) {
  if (
    !messages.errors?.length && !messages.warnings?.length
  ) return null

  return (
    <dialog
      role='alertdialog'
      open
      class='freshBlog-dialogMessages'
    >
      {messages.errors && (
        <dl class='freshBlog-dialogMessages-errors'>
          {messages.errors?.map((error) => (
            <>
              <dt>🚫 {error.property}</dt>
              <dd>{error.message}</dd>
            </>
          ))}
        </dl>
      )}
      {messages.warnings && (
        <dl>
          {messages.warnings?.map((warning) => (
            <>
              <dt>⚠️ {warning.property}</dt>
              <dd>{warning.message}</dd>
            </>
          ))}
        </dl>
      )}
      <form method='dialog'>
        <button>Close</button>
      </form>
    </dialog>
  )
}
