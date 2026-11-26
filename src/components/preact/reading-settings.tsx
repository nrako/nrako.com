import { useEffect, useRef, useState } from 'preact/hooks'

import TextSize from '@/components/icons/TextSize'
import {
  applyReadingSetting,
  readReadingSetting,
  readingSettings,
  type ReadingBackground,
  type ReadingFont,
  type ReadingSetting,
  type ReadingSize,
  type ReadingWeight,
} from '@/lib/reading'

const POPOVER_ID = 'reading-settings'

interface Choice<Value> {
  value: Value
  label: string
}

// A typeface or a background shows its name drawn with it; a size or a
// weight shows an "A" drawn with it
const groups = [
  {
    setting: 'font',
    legend: 'Typeface',
    sample: 'label',
    choices: [
      { value: 'sans', label: 'Sans' },
      { value: 'serif', label: 'Serif' },
      { value: 'hyperlegible', label: 'Hyperlegible' },
    ] satisfies Choice<ReadingFont>[],
  },
  {
    setting: 'size',
    legend: 'Size',
    sample: 'letter',
    choices: [
      { value: 'small', label: 'Smaller' },
      { value: 'medium', label: 'Default' },
      { value: 'large', label: 'Larger' },
    ] satisfies Choice<ReadingSize>[],
  },
  {
    setting: 'weight',
    legend: 'Weight',
    sample: 'letter',
    choices: [
      { value: 'light', label: 'Lighter' },
      { value: 'regular', label: 'Default' },
      { value: 'heavy', label: 'Heavier' },
    ] satisfies Choice<ReadingWeight>[],
  },
  {
    setting: 'background',
    legend: 'Background',
    sample: 'label',
    choices: [
      { value: 'contrast', label: 'Contrast' },
      { value: 'soft', label: 'Soft' },
    ] satisfies Choice<ReadingBackground>[],
  },
] as const satisfies {
  setting: ReadingSetting
  legend: string
  sample: 'label' | 'letter'
  choices: Choice<string>[]
}[]

type ReadingValues = Record<ReadingSetting, string>

const defaults = Object.fromEntries(
  Object.entries(readingSettings).map(([setting, { default: value }]) => [
    setting,
    value,
  ]),
) as ReadingValues

export default function ReadingSettings() {
  // Disabled until hydrated: without JavaScript nothing would apply a choice
  const [ready, setReady] = useState(false)
  const [values, setValues] = useState<ReadingValues>(defaults)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setValues({
      font: readReadingSetting('font'),
      size: readReadingSetting('size'),
      weight: readReadingSetting('weight'),
      background: readReadingSetting('background'),
    })
    setReady(true)
  }, [])

  // The menu opens under the button, aligned on its right edge. In the top
  // layer an absolute box is placed on the document, so it scrolls with it
  useEffect(() => {
    const popover = popoverRef.current
    if (!popover) return

    const place = (event: Event) => {
      if ((event as ToggleEvent).newState !== 'open') return
      if (!buttonRef.current) return
      const button = buttonRef.current.getBoundingClientRect()
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
    setValues((current) => ({ ...current, [setting]: value }))
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
            ? 'Typeface, size, weight and background of the text'
            : 'Not available when JavaScript is disabled'
        }
        class="cursor-pointer disabled:cursor-default disabled:text-gray-500 [&:not(:disabled):hover]:text-red-600"
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
        {groups.map(({ setting, legend, sample, choices }) => (
          <fieldset key={setting}>
            <legend>{legend}</legend>
            {choices.map(({ value, label }) => (
              <label
                key={value}
                {...{ [`data-reading-${setting}-sample`]: value }}
              >
                <input
                  type="radio"
                  name={`reading-${setting}`}
                  value={value}
                  checked={values[setting] === value}
                  onChange={() => choose(setting, value)}
                />
                {sample === 'label' ? (
                  label
                ) : (
                  <>
                    <span aria-hidden="true">A</span>
                    <span class="sr-only">{label}</span>
                  </>
                )}
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </>
  )
}
