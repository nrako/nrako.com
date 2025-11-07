import { useEffect, useState } from 'preact/hooks'
import MoonIcon from '@preact-icons/tb/TbMoonStars'
import SunIcon from '@preact-icons/tb/TbSunHigh'
import SunMoonIcon from '@preact-icons/tb/TbSunMoon'

export default function ThemeToggle() {
  // Retrieve user preference theme in SessionStorage if any
  const [userTheme, setUserTheme] = useState(() => {
    return globalThis.sessionStorage?.getItem('theme')
  })

  // Apply any user preference theme to the document
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.remove('light')
    if (!['dark', 'light'].includes(userTheme || '')) return

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
      class='rounded-full [&:not(:disabled):hover]:text-red-600 disabled:text-gray-500'
    >
      <span class='group-hover:hidden'>
        {!userTheme
          ? <SunMoonIcon />
          : userTheme === 'dark'
          ? <SunIcon />
          : <MoonIcon />}
      </span>
      <span class='hidden group-hover:block'>
        {userTheme === 'dark' ||
            userTheme === undefined &&
              typeof globalThis.matchMedia !== 'undefined' &&
              globalThis.matchMedia('(prefers-color-scheme: dark)')?.matches
          ? <SunIcon />
          : <MoonIcon />}
      </span>
    </button>
  )
}
