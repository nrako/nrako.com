import { useEffect, useRef, useState } from 'preact/hooks'
import TextSize from '@/components/icons/TextSize'
import {
  applyReadingSetting,
  readReadingSetting,
  type ReadingFont,
  type ReadingSetting,
  type ReadingSize,
} from '@/lib/reading'

const POPOVER_ID = 'reading-settings'

const fonts: { value: ReadingFont; label: string }[] = [
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'hyperlegible', label: 'Hyperlegible' },
]

const sizes: { value: ReadingSize; label: string }[] = [
  { value: 'small', label: 'Smaller' },
  { value: 'medium', label: 'Default' },
  { value: 'large', label: 'Larger' },
]

export default function ReadingSettings() {
  // Disabled until hydrated: without JavaScript nothing would apply a choice
  const [ready, setReady] = useState(false)
  const [font, setFont] = useState<string>('sans')
  const [size, setSize] = useState<string>('medium')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFont(readReadingSetting('font'))
    setSize(readReadingSetting('size'))
    setReady(true)
  }, [])

  // The menu opens under the button, aligned on its right edge. In the top
  // layer an absolute box is placed on the document, so it scrolls with it
  useEffect(() => {
    const popover = popoverRef.current
    if (!popover) return

    const place = (event: Event) => {
      if ((event as ToggleEvent).newState !== 'open') return
      const button = buttonRef.current!.getBoundingClientRect()
      const root = document.documentElement
      popover.style.top = `${button.bottom + window.scrollY + 8}px`
      popover.style.right = `${root.clientWidth - button.right - window.scrollX}px`
    }
    const close = () => popover.hidePopover()

    popover.addEventListener('beforetoggle', place)
    window.addEventListener('resize', close)
    return () => {
      popover.removeEventListener('beforetoggle', place)
      window.removeEventListener('resize', close)
    }
  }, [])

  const choose = (setting: ReadingSetting, value: string) => {
    applyReadingSetting(setting, value)
    if (setting === 'font') setFont(value)
    else setSize(value)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={POPOVER_ID}
        disabled={!ready}
        aria-label="Reading settings"
        title={
          ready
            ? 'Typeface and text size'
            : 'Not available when JavaScript is disabled'
        }
        class="[&:not(:disabled):hover]:text-red-600 disabled:text-gray-500 cursor-pointer disabled:cursor-default"
      >
        <TextSize />
      </button>
      <div
        ref={popoverRef}
        popover="auto"
        id={POPOVER_ID}
        class="reading-settings"
        aria-label="Reading settings"
      >
        <fieldset>
          <legend>Typeface</legend>
          {fonts.map(({ value, label }) => (
            <label key={value} data-reading-font-sample={value}>
              <input
                type="radio"
                name="reading-font"
                value={value}
                checked={font === value}
                onChange={() => choose('font', value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Size</legend>
          {sizes.map(({ value, label }) => (
            <label key={value} data-reading-size-sample={value}>
              <input
                type="radio"
                name="reading-size"
                value={value}
                checked={size === value}
                onChange={() => choose('size', value)}
              />
              <span aria-hidden="true">A</span>
              <span class="sr-only">{label}</span>
            </label>
          ))}
        </fieldset>
      </div>
    </>
  )
}
