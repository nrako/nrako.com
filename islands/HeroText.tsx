import { IS_BROWSER } from 'fresh/runtime'
import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'preact/hooks'
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

const allOptions = [titleOptions, codingOptions, helpOptions, howOptions]

function findLongestOption(options: string[]) {
  return options.reduce((a, b) => (a.length > b.length ? a : b), '')
}

const longestTitle = findLongestOption(titleOptions)
const longestCoding = findLongestOption(codingOptions)
const longestHelp = findLongestOption(helpOptions)
const longestHow = findLongestOption(howOptions)

const longestText =
  `I am a ${longestTitle} based in Switzerland. I got into coding ${longestCoding}. I help cross-functional teams ${longestHelp} Mobile and Web apps ${longestHow}`

interface PartState {
  text: string
  nextText: string
}

interface State {
  parts: PartState[]
}

type Action =
  | { type: 'START_ANIMATION'; partIndex: number }
  | { type: 'COMPLETE_ANIMATION'; partIndex: number }

function getRandomOption(options: string[], excludeText: string): string {
  let nextIndex = Math.floor(Math.random() * options.length)
  // Ensure we pick a different option if possible
  while (options[nextIndex] === excludeText && options.length > 1) {
    nextIndex = Math.floor(Math.random() * options.length)
  }
  return options[nextIndex]
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_ANIMATION': {
      const { partIndex } = action
      const currentText = state.parts[partIndex].text
      const options = allOptions[partIndex]
      const nextText = getRandomOption(options, currentText)

      return {
        ...state,
        parts: state.parts.map((part, i) =>
          i === partIndex ? { ...part, nextText } : part
        ),
      }
    }
    case 'COMPLETE_ANIMATION': {
      const { partIndex } = action
      const nextText = state.parts[partIndex].nextText

      return {
        ...state,
        parts: state.parts.map((part, i) =>
          i === partIndex ? { text: nextText, nextText: '' } : part
        ),
      }
    }
    default:
      return state
  }
}

function createInitialState(): State {
  return {
    parts: allOptions.map((options) => ({
      text: getRandomOption(options, ''),
      nextText: '',
    })),
  }
}

export default function HeroText() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState)
  const [minHeight, setMinHeight] = useState('auto')
  const measurementRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (measurementRef.current) {
      setMinHeight(`${measurementRef.current.clientHeight}px`)
    }
  }, [])

  const currentPartIndexRef = useRef(
    Math.floor(Math.random() * allOptions.length),
  )

  useEffect(() => {
    const totalAnimationTime = 8 * 1000
    const intervalBetweenAnimations = 6 * 1000

    let isMounted = true
    const timeouts: number[] = []

    const animateNextPart = () => {
      if (!isMounted) return

      // Move to next part
      currentPartIndexRef.current = (currentPartIndexRef.current + 1) %
        allOptions.length
      const partIndex = currentPartIndexRef.current

      // Start animation - reducer handles picking different text
      dispatch({ type: 'START_ANIMATION', partIndex })

      // After animation completes, commit the change
      const timeout1 = setTimeout(() => {
        dispatch({ type: 'COMPLETE_ANIMATION', partIndex })

        // Schedule next animation
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
  }, []) // Empty dependency array - reducer handles all state logic

  const [titlePart, codingPart, helpPart, howPart] = state.parts

  return (
    <>
      <p
        class='text-md md:text-2xl text-center max-w-2xl font-mono'
        style={{ minHeight }}
      >
        I am a{' '}
        <VimReplaceText text={titlePart.text} newText={titlePart.nextText} />
        {' '}
        based in Switzerland. I got into coding{' '}
        <VimReplaceText text={codingPart.text} newText={codingPart.nextText} />
        . I help cross-functional teams{' '}
        <VimReplaceText text={helpPart.text} newText={helpPart.nextText} />{' '}
        Mobile and Web apps{' '}
        <VimReplaceText text={howPart.text} newText={howPart.nextText} />
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
