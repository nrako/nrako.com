import type { PageProps } from 'fresh'
import ThemeToggle from '../islands/ThemeToggle.tsx'
import GithubIcon from '@preact-icons/gr/GrGithub'
import LinkedinIcon from '@preact-icons/gr/GrLinkedinOption'
import AtIcon from '@preact-icons/tb/TbAt'
import IconRss from '@preact-icons/tb/TbRss'

export default function App({ Component }: PageProps) {
  return (
    <html lang='en'>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta name='description' content="nrako's personal website" />
        <title>nrako.com</title>
        <link rel='stylesheet' href='/styles.css' />
        <link rel='stylesheet' href='/freshblog.css' />
        <script src='/freshblog.js' defer type='module'></script>
      </head>
      <body class='bg-white dark:bg-black text-black dark:text-white font-sans'>
        <header class='flex gap-4 container mx-auto pt-8 text-3xl px-4 md:px-12 align-baseline'>
          <nav class='flex place-items-end flex-1 gap-4 [&>a:hover]:text-red-600'>
            <a href='/' aria-label='Home Base' title='Home Base'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='1em'
                height='1em'
                viewBox='0 0 24 24'
                class='place-self-start'
                stroke-width={2}
                stroke='currentColor'
              >
                <path
                  d='M 2,2 L 22,2 L 22,12 L 12,22 L 2,12 Z'
                  stroke='currentColor'
                  fill='none'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </a>
            <a href='/posts' aria-label='Blog' title='Posts' class='text-2xl'>
              Posts
            </a>

            <a
              href='https://bsky.app/profile/nrako.bsky.social'
              aria-label='Social'
              title='Follow me and at-me on Bsky'
              class='ml-auto'
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
        <main class='container mx-auto min-h-screen px-4 md:px-12 mt-20'>
          <Component />
        </main>
        <footer class='text-sm flex justify-between container mx-auto my-4 px-4 md:px-12'>
          <div class='freshBlog-footer'>
            <IconRss />
            <ul className='feed-links'>
              <li>
                <a href='/feed/atom' title='Atom 1.0'>Atom</a>
              </li>
              <li>
                <a href='/feed/json' title='JSON Feed 1.0'>
                  JSON
                </a>
              </li>
              <li>
                <a href='/feed/rss' title='RSS 2.0'>RSS</a>
              </li>
            </ul>
          </div>
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
