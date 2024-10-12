import { IS_BROWSER } from 'fresh/runtime'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import VimReplaceText from './VimReplaceText.tsx'

const titleOptions = [
  'Web App Developer',
  'Technical Product Manager',
  'Tech Design Lead',
]

const codingOptions = [
  'shortly after IE6 was released',
  'when the iPhone was only a rumor',
  'when AJAX was still called XMLHttpRequest',
  'when MySpace was the hype',
]

const helpOptions = ['shape', 'successfully ship', 'refine']

const howOptions = [
  'by driving iterative design & development.',
  'by adopting the ShapeUp methodology.',
  'to reach their business goals!',
  'by aligning on expectations and goals.',
  'with advanced design system.',
]

function findLongestOption(options: string[]) {
  return options.reduce((a, b) => (a.length > b.length ? a : b), '')
}
// Manually compose the longest possible text for measuring
const longestTitle = findLongestOption(titleOptions)
const longestCoding = findLongestOption(codingOptions)
const longestHelp = findLongestOption(helpOptions)
const longestHow = findLongestOption(howOptions)

const longestText =
  `I am a ${longestTitle} based in Switzerland. I got into coding ${longestCoding}. I help cross-functional teams ${longestHelp} Mobile and Web apps ${longestHow}`

export default function HeroText() {
  // Initialize texts
  const [titleText, setTitleText] = useState(
    titleOptions[Math.floor(Math.random() * titleOptions.length)],
  )
  const [codingText, setCodingText] = useState(
    codingOptions[Math.floor(Math.random() * codingOptions.length)],
  )
  const [helpText, setHelpText] = useState(
    helpOptions[Math.floor(Math.random() * helpOptions.length)],
  )
  const [howText, setHowText] = useState(
    howOptions[Math.floor(Math.random() * howOptions.length)],
  )

  // New texts (next phrases)
  const [nextTitleText, setNextTitleText] = useState('')
  const [nextCodingText, setNextCodingText] = useState('')
  const [nextHelpText, setNextHelpText] = useState('')
  const [nextHowText, setNextHowText] = useState('')

  // Array to keep track of text parts
  const textParts = [
    {
      key: 'title',
      text: titleText,
      setText: setTitleText,
      options: titleOptions,
      nextText: nextTitleText,
      setNextText: setNextTitleText,
    },
    {
      key: 'coding',
      text: codingText,
      setText: setCodingText,
      options: codingOptions,
      nextText: nextCodingText,
      setNextText: setNextCodingText,
    },
    {
      key: 'help',
      text: helpText,
      setText: setHelpText,
      options: helpOptions,
      nextText: nextHelpText,
      setNextText: setNextHelpText,
    },
    {
      key: 'how',
      text: howText,
      setText: setHowText,
      options: howOptions,
      nextText: nextHowText,
      setNextText: setNextHowText,
    },
  ]

  const [minHeight, setMinHeight] = useState('auto')
  const measurementRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (measurementRef.current) {
      setMinHeight(`${measurementRef.current.clientHeight}px`) // Set the min-height dynamically based on the maximum height
    }
  }, [])

  // Use useRef to keep currentPartIndex between renders
  const currentPartIndexRef = useRef(
    Math.floor(Math.random() * textParts.length),
  )

  useEffect(() => {
    const totalAnimationTime = 8 * 1000 // Adjust based on TextPart's animation duration
    const intervalBetweenAnimations = 8 * 1000 // 8 seconds

    let isMounted = true
    const timeouts: number[] = []

    const animateNextPart = () => {
      if (!isMounted) return

      // Increment currentPartIndex and wrap around
      currentPartIndexRef.current = (currentPartIndexRef.current + 1) %
        textParts.length
      const currentPart = textParts[currentPartIndexRef.current]

      // Determine next text
      const currentOptions = currentPart.options
      const currentText = currentPart.text
      const setText = currentPart.setText
      const setNextText = currentPart.setNextText

      let nextIndex = Math.floor(Math.random() * currentOptions.length)

      // Ensure nextIndex is different from currentIndex
      while (currentOptions[nextIndex] === currentText) {
        nextIndex = Math.floor(Math.random() * currentOptions.length)
      }

      const nextPhrase = currentOptions[nextIndex]
      setNextText(nextPhrase)

      // After animation, update the text
      const timeout1 = setTimeout(() => {
        setText(nextPhrase)
        setNextText('') // Reset newText to stop animation

        // Schedule next animation after interval
        const timeout2 = setTimeout(() => {
          animateNextPart()
        }, intervalBetweenAnimations)
        timeouts.push(timeout2)
      }, totalAnimationTime)
      timeouts.push(timeout1)
    }

    // Start the animation cycle after initial delay
    const initialDelay = 2000
    const initialTimeout = setTimeout(() => {
      animateNextPart()
    }, initialDelay)
    timeouts.push(initialTimeout)

    // Cleanup function
    return () => {
      isMounted = false
      timeouts.forEach((t) => clearTimeout(t))
    }
  }, [titleText, codingText, helpText, howText])

  return (
    <>
      <p
        class='text-md md:text-2xl text-center max-w-2xl font-mono'
        style={{ minHeight }}
      >
        I am a <VimReplaceText text={titleText} newText={nextTitleText} />{' '}
        based in Switzerland. I got into coding{' '}
        <VimReplaceText text={codingText} newText={nextCodingText} />
        . I help cross-functional teams{' '}
        <VimReplaceText text={helpText} newText={nextHelpText} />{' '}
        Mobile and Web apps{' '}
        <VimReplaceText text={howText} newText={nextHowText} />
      </p>
      {/* Hidden container for measuring text heights */}
      {IS_BROWSER && (
        <div
          class='text-md md:text-2xl text-center max-w-2xl font-mono'
          ref={measurementRef}
          style={{ visibility: 'hidden', position: 'absolute', top: '-9999px' }}
          aria-hidden='true'
          role='presentation'
        >
          {longestText}
        </div>
      )}
    </>
  )
}
