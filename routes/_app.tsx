import type { PageProps } from 'fresh'
import ThemeToggle from '../islands/ThemeToggle.tsx'
import GithubIcon from '@preact-icons/gr/GrGithub'
import LinkedinIcon from '@preact-icons/gr/GrLinkedinOption'
import AtIcon from '@preact-icons/tb/TbAt'

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>nrako.com</title>
        <link rel='stylesheet' href='/styles.css' />
      </head>
      <body class='bg-white dark:bg-black text-black dark:text-white font-sans'>
        <header class='flex justify-end gap-4 container mx-auto pt-8 text-3xl'>
          <nav class='flex gap-4 [&>a:hover]:text-red-600'>
            <a
              href='https://bsky.app/profile/nrako.bsky.social'
              aria-label='Social'
              title='Follow me and at-me on Bsky'
            >
              <AtIcon />
            </a>
            <a
              href='https://linkedin.com/in/nrako'
              aria-label='LinkedIn'
              title='Connect with me on LinkedIn'
            >
              <LinkedinIcon />
            </a>
            <a
              href='https://github.com/nrako'
              title='Collaborate with me on GitHub'
              aria-label='GitHub'
            >
              <GithubIcon />
            </a>
          </nav>
          <ThemeToggle />
        </header>
        <main class='container mx-auto min-h-screen'>
          <Component />
        </main>
        <footer class='text-sm flex justify-end container mx-auto my-4'>
          <a
            class='hover:underline decoration-red-600 underline-offset-2 decoration-2'
            href='https://github.com/nrako/nrako.com'
          >
            Source
          </a>
        </footer>
      </body>
    </html>
  )
}
