import { useEffect, useState } from 'preact/hooks'
import TbMoonStars from '@/components/icons/TbMoonStars'
import TbSunHigh from '@/components/icons/TbSunHigh'
import TbSunMoon from '@/components/icons/TbSunMoon'

export default function ThemeToggle() {
  // Start with null during SSR, then read from sessionStorage after mount
  const [userTheme, setUserTheme] = useState<string | null>(null)

  // Read stored theme preference after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    const stored = globalThis.sessionStorage?.getItem('theme')
    if (stored) setUserTheme(stored)
  }, [])

  // Apply any user preference theme to the document
  // Only modify classes if user has explicitly chosen a theme
  useEffect(() => {
    if (!['dark', 'light'].includes(userTheme || '')) return

    document.documentElement.classList.remove('dark')
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add(userTheme!)
  }, [userTheme])

  // Enable the button when JavaScript is enabled
  useEffect(() => {
    const button = document.getElementById(
      'theme-toggle-button',
    ) as HTMLButtonElement
    if (button) {
      button.disabled = false
      button.classList.add('group')
      button.title = 'Click to toggle theme'
    }
  }, [])

  const toggleTheme = () => {
    setUserTheme((userTheme) => {
      const selectedTheme = !userTheme
        ? globalThis.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'light'
          : 'dark'
        : userTheme === 'light'
        ? 'dark'
        : 'light'
      globalThis.sessionStorage.setItem('theme', selectedTheme)
      return selectedTheme
    })
  }

  return (
    <button
      type='button'
      id='theme-toggle-button'
      onClick={toggleTheme}
      disabled
      title='Not available when JavaScript is disabled'
      aria-label='Toggle Theme'
      class='rounded-full [&:not(:disabled):hover]:text-red-600 disabled:text-gray-500 text-3xl cursor-pointer disabled:cursor-default'
    >
      <span class='group-hover:hidden'>
        {!userTheme
          ? <TbSunMoon />
          : userTheme === 'dark'
          ? <TbSunHigh />
          : <TbMoonStars />}
      </span>
      <span class='hidden group-hover:block'>
        {userTheme === 'dark' ||
            (userTheme === undefined &&
              typeof globalThis.matchMedia !== 'undefined' &&
              globalThis.matchMedia('(prefers-color-scheme: dark)')?.matches)
          ? <TbSunHigh />
          : <TbMoonStars />}
      </span>
    </button>
  )
}
