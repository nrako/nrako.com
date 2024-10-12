import { useEffect, useState } from 'preact/hooks'

export default function VimReplaceText({ text, newText }: {
  text: string
  newText: string
}) {
  const [displayedText, setDisplayedText] = useState(text)
  const [isCursorVisible, setIsCursorVisible] = useState(false)
  const [isVisualMode, setIsVisualMode] = useState(false)
  const [isCursorAtEnd, setIsCursorAtEnd] = useState(false)
  const [isTextSelected, setIsTextSelected] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    let timeoutId: number | undefined

    if (!newText || newText === '' || text === newText) {
      // No newText or same text, reset to initial state
      setDisplayedText(text)
      setIsCursorVisible(false)
      setIsVisualMode(false)
      setIsCursorAtEnd(false)
      setIsTextSelected(false)
      setAnimationStep(0)
      return
    }

    // Start the animation sequence
    setAnimationStep(1)

    // Cleanup function
    return () => clearTimeout(timeoutId)
  }, [text, newText])

  useEffect(() => {
    let timeoutId: number | undefined

    if (animationStep === 0) {
      // Do nothing if not animating
      return
    }

    const typingDelay = 70 // Typing speed (ms per character)
    const pauseBetweenSteps = 800 // General pause between steps

    const typeNewText = () => {
      let charIndex = 0

      const type = () => {
        charIndex++
        setDisplayedText(newText.substring(0, charIndex))
        if (charIndex < newText.length) {
          timeoutId = setTimeout(type, typingDelay)
        } else {
          setIsCursorVisible(false) // Hide cursor after typing
          setAnimationStep(0) // Reset animationStep
        }
      }

      type()
    }

    switch (animationStep) {
      case 1:
        // Show cursor at the beginning
        setIsCursorVisible(true)
        setIsVisualMode(true)
        setIsCursorAtEnd(false)
        setIsTextSelected(false)
        timeoutId = setTimeout(() => {
          setAnimationStep(2)
        }, pauseBetweenSteps)
        break
      case 2:
        // Move cursor to the end and select text
        setIsCursorAtEnd(true)
        setIsTextSelected(true)
        timeoutId = setTimeout(() => {
          setAnimationStep(3)
        }, pauseBetweenSteps)
        break
      case 3:
        // Delete the text
        setDisplayedText('')
        setIsVisualMode(false)
        setIsTextSelected(false)
        setIsCursorAtEnd(false)
        timeoutId = setTimeout(() => {
          setAnimationStep(4)
        }, pauseBetweenSteps)
        break
      case 4:
        // Type the new text
        setIsCursorVisible(true)
        setIsVisualMode(false)
        typeNewText()
        break
      default:
        break
    }

    // Cleanup function
    return () => clearTimeout(timeoutId)
  }, [animationStep, newText])

  return (
    <span class={`${isTextSelected ? 'vim-visual-mode' : ''}`}>
      {isCursorVisible && isVisualMode && !isCursorAtEnd && (
        <span class='visual-cursor' />
      )}
      {displayedText}
      {isCursorVisible && (
        !isVisualMode
          ? <span class='insert-cursor' />
          : isVisualMode && isCursorAtEnd
          ? <span class='visual-cursor' />
          : null
      )}
    </span>
  )
}
