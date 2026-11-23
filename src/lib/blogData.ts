import type { PageFrontmatter } from 'myst-frontmatter'
import type { Messages } from './processor.ts'
import type { CommitInfo } from './githubVersioning.ts'
import type { PostSnippet } from './snippets.ts'
import { extname, join } from 'node:path'
import processor from './processor.ts'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { parseHTML } from 'linkedom'
import { getCommitHistory, isDraftVersion } from './githubVersioning.ts'
import process from 'node:process'

// 200 word-per-minute is on the lower range of the average reading speed 200-300 wpm
const WPM = 200

export interface BlogOptions {
  title: string
  /** Description of the posts, used in the feeds */
  description: string
  /** BCP 47 language code, used to format dates and times */
  language: string
  /**
   * Directory of the markdown (*.md) posts. The `POSTS_DIR` environment
   * variable overrides it, which the e2e tests use to build the site from
   * fixture posts.
   */
  contentDir: string
  /** Path of the favicon, used in the feeds */
  favicon: string
  copyright: string
  /** Program named in the RSS 2.0 feed's `generator` */
  generator: string
  /** Shiki themes, see https://shiki.style/themes */
  highlighter: {
    themes: {
      light: string
      dark: string
    }
    /** Colours swapped in a theme, by theme name */
    colorReplacements?: Record<string, Record<string, string>>
  }
  /** Authors of every post whose frontmatter names none */
  defaultAuthors?: PageFrontmatter['authors']
  /**
   * Where authors are shown: `always` (listings and posts), `only_in_posts`
   * or `never`
   */
  showAuthors: 'always' | 'only_in_posts' | 'never'
  versioning:
    | {
        provider: 'github'
        mainBranch: string
        repoOwner: string
        repoName: string
      }
    | undefined
}

export interface Post {
  /** slug of the post, derived from the filename */
  slug: string
  frontmatter: PageFrontmatter
  /** HTML content of the post */
  content: string
  messages: Messages
  /** The snippets of the post that have a page of their own */
  snippets: PostSnippet[]
  readingTimeMinutes: number
  versions?: CommitInfo[]
}

export const defaultOptions: BlogOptions = {
  title: "Nicholas's Posts",
  description: 'All my posts as seen on nrako.com',
  language: 'en',
  contentDir: process.env.POSTS_DIR || './posts',
  favicon: '/favicon.ico',
  copyright: 'Copyright 2024 www.nrako.com',
  generator: 'Feed (https://github.com/jpmonette/feed) for Node.js',
  highlighter: {
    themes: {
      light: 'github-light-high-contrast',
      dark: 'github-dark-high-contrast',
    },
    // Every token at 7:1 or more on the code's background in both themes and
    // both reading backgrounds, as the text is; the light theme's comments
    // alone fall short (4.5:1) and are darkened to reach it.
    colorReplacements: {
      'github-light-high-contrast': { '#66707b': '#474f58' },
    },
  },
  showAuthors: 'only_in_posts',
  versioning: {
    provider: 'github',
    mainBranch: 'main',
    repoOwner: 'nrako',
    repoName: 'nrako.com',
  },
}

/**
 * Get all posts, newest first. Reads the filesystem, so it only runs in Node
 * (build and dev), never in workerd.
 */
export async function getPosts(
  options: BlogOptions = defaultOptions,
): Promise<Post[]> {
  // Git does not track empty directories: with nothing published, the
  // content directory does not exist in a fresh clone.
  if (!existsSync(options.contentDir)) return []

  const files = readdirSync(options.contentDir, { withFileTypes: true })
  const promises = []

  for (const fileOrFolder of files) {
    if (fileOrFolder.isDirectory()) continue
    if (extname(fileOrFolder.name) !== '.md') continue
    const slug = fileOrFolder.name.replace('.md', '')
    promises.push(getPost(slug, options))
  }

  const posts = (await Promise.all(promises)) as Post[]
  posts.sort(
    (a, b) =>
      Date.parse(b.frontmatter.date ?? '') -
      Date.parse(a.frontmatter.date ?? ''),
  )
  return posts
}

/**
 * Get a single post by slug. Reads the filesystem, so it only runs in Node
 * (build and dev), never in workerd.
 */
export async function getPost(
  slug: string,
  options: BlogOptions = defaultOptions,
): Promise<Post | null> {
  const filePath = join(options.contentDir, `${slug}.md`)
  if (!existsSync(filePath)) return null

  const text = readFileSync(filePath, 'utf-8')
  const { frontmatter, html, messages, snippets } = await processor(text, {
    ...options,
    address: `/posts/${slug}`,
    loadFile(path) {
      const file = join(options.contentDir, path)
      return existsSync(file) ? readFileSync(file, 'utf-8') : undefined
    },
  })

  const metadata: Post = {
    slug,
    frontmatter,
    content: html,
    messages,
    snippets,
    readingTimeMinutes: calculateReadingTime(html),
  }

  // Fetch versions from GitHub (only at build time or in dev)
  const githubToken = import.meta.env?.GITHUB_TOKEN || process.env.GITHUB_TOKEN
  if (githubToken && options.versioning) {
    metadata.versions = await getCommitHistory(slug, options)

    if (
      metadata.versions.length > 0 &&
      (await isDraftVersion(slug, text, metadata.versions[0], options))
    ) {
      metadata.versions.unshift({
        sha: 'draft',
        shortSha: 'draft',
        message: 'Uncommitted version',
        date: new Date().toISOString(),
        author: '',
        verified: false,
      })
    }
  }

  return metadata
}

/**
 * Calculates the reading time for a given html content.
 */
export function calculateReadingTime(html: string): number {
  const { document } = parseHTML(html)
  const textContent = document.body?.textContent ?? ''

  const wordCount =
    textContent.replace(/[-*\s\n]+/gm, ' ').split(/\s/).length ?? 0

  return Math.ceil(wordCount / WPM)
}
