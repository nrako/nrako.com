import type { PageFrontmatter } from 'myst-frontmatter'
import type { Messages } from './processor.ts'
import type { CommitInfo } from './githubVersionning.ts'
// Importing two new std lib functions to help with parsing front matter and joining file paths.
import { extname, join } from '@std/path'
import processor from './processor.ts'
import { ensureDir, exists } from '@std/fs'
import { crypto } from '@std/crypto'
import { encodeHex } from '@std/encoding'
import { DOMParser } from '@b-fuze/deno-dom'
import { getCommitHistory } from './githubVersionning.ts'
import { isDraftVersion } from './githubVersionning.ts'

// 200 word-per-minute is on the lower range of the average reading speed 200-300 wpm
const WPM = 200

export interface InternalOptions {
  /**
   * Cache backend to use, either "filesystem" or "kv"
   * @default { 'kv' }
   */
  cacheBackend?: 'filesystem' | 'kv'
  /**
   * Title of the blog
   * @default { 'Blog' }
   */
  title: string
  /**
   * Description of the blog content, this is used in the syndicate feeds
   * @default { 'This is a Fresh Blog' }
   */
  description: string
  /**
   * Language code BCP 47, currently used to format date and time format
   * @default { 'en' }
   */
  language: string
  /**
   * Path to folder containing the markdown (*.md) files
   * @default { './posts' }
   */
  contentDir: string
  /**
   * Path of the favicon, this is used in the feeds
   * @default { '/favicon.ico' }
   */
  favicon: string
  /**
   * Copyright text, `{{year}}` and `{{url}}` can be used for automatic replacement
   * @default { 'Copryright {{year}} {{url}}' }
   */
  copyright: string
  /**
   * A string used in RSS 2.0 feed to indicate the program used to generate the channel.
   * @default { 'Feed (https://github.com/jpmonette/feed) for Deno' }
   */
  generator: string
  /**
   * Configuration passed to the code highlighter Shiki where `light` and `dark`
   * themes can be set. See https://shiki.style/themes for supported themes.
   * @default { { themes: { light: 'material-theme-lighter', dark: 'material-theme-darker' } } }
   */
  highlighter: {
    themes: {
      light: string
      dark: string
    }
  }
  /**
   * Name of the CSS file which will be exported by the plugin for the blog
   * @default { 'freshblog.css' }
   */
  cssFilename: string
  /**
   * Name of the JavaScript file (polyfill) which will be exported by the plugin for the blog
   * @default { 'freshblog.js' }
   */
  jsFilename: string
  /** Determine the author(s) to display for all posts when the `authors` entry
   * is not defined in frontmatter. Useful for personal blog when the author is
   * often the same and rarely need to be overridden.
   * @default { undefined }
   */
  defaultAuthors?: PageFrontmatter['authors']
  /** Determines when to show authors
   * ```
   * 'always' - always show authors in both the listing of blog posts and in the post
   * 'only_in_posts' - only show authors in the post
   * 'never' - never show authors
   * ```
   *  @default 'only_in_posts'
   */
  showAuthors: 'always' | 'only_in_posts' | 'never'

  /**
   * Configure versionning
   *
   * @type {({
   *     provider: 'github'
   *     mainBranch: string
   *     repoOwner: string
   *     repoName: string
   *   } | undefined)}
   */
  versionning: {
    provider: 'github'
    mainBranch: string
    repoOwner: string
    repoName: string
  } | undefined

  /** This is used to mock a dev environement in tests do not use this
   * @ignore
   */
  dev?: boolean
}

export interface Post {
  /** slug of the post, derived from the filename */
  slug: string
  frontmatter: PageFrontmatter
  /** HTML content of the post */
  content: string
  messages: Messages
  readingTimeMinutes: number
  versions?: CommitInfo[]
}

export const defaultOptions = {
  cacheBackend: 'kv' as 'filesystem' | 'kv',
  title: 'Nicholas´s Posts',
  description: 'All my posts as seen on nrako.com',
  language: 'en',
  contentDir: './posts',
  path: '/posts',
  favicon: '/favicon.ico',
  copyright: 'Copyright 2024 www.nrako.com',
  generator: 'Feed (https://github.com/jpmonette/feed) for Deno',
  highlighter: {
    themes: {
      light: 'material-theme-lighter',
      dark: 'material-theme-darker',
    },
  },
  cssFilename: 'freshblog.css',
  jsFilename: 'freshblog.js',
  showAuthors: 'only_in_posts' as 'always' | 'only_in_posts' | 'never',
  versionning: {
    // deno-lint-ignore prefer-as-const
    provider: 'github' as 'github',
    mainBranch: 'main',
    repoOwner: 'nrako',
    repoName: 'nrako.com',
  },
  dev: false,
}

/**
 * `getPosts` returns all the posts at the given `options.contentDir`
 *
 * @todo support paginations
 *
 * @export
 * @async
 * @param {InternalOptions} options
 * @returns {Promise<Post[]>}
 */
export async function getPosts(options: InternalOptions): Promise<Post[]> {
  const files = Deno.readDir(options.contentDir)
  const promises = []
  for await (const fileOrFolder of files) {
    if (fileOrFolder.isDirectory) continue
    if (extname(fileOrFolder.name) !== '.md') continue
    const file = fileOrFolder
    const slug = file.name.replace('.md', '')
    promises.push(getPost(slug, options))
  }
  const posts = await Promise.all(promises) as Post[]
  posts.sort((a, b) =>
    Date.parse(b.frontmatter.date ?? '') - Date.parse(a.frontmatter.date ?? '')
  )
  return posts
}

/**
 * `getPost` returns a post located in `options.contentDir` for the given `slug`
 *
 * @export
 * @async
 * @param {string} slug
 * @param {InternalOptions} options
 * @returns {Promise<Post | null>}
 */
export async function getPost(
  slug: string,
  options: InternalOptions,
): Promise<Post | null> {
  const filePath = join(options.contentDir, `${slug}.md`)
  if (!(await exists(filePath))) return null

  const hash = await getHashForFile(filePath)
  const cache = await readCache(options, [slug, hash])

  if (cache) {
    return {
      ...cache.metadata,
      content: cache.html,
    }
  }
  const text = await Deno.readTextFile(filePath)
  const { frontmatter, html, messages } = await processor(text, options)

  const metadata: Omit<Post, 'content'> = {
    slug,
    frontmatter,
    messages,
    readingTimeMinutes: calculateReadingTime(html),
  }

  if (Deno.env.get('GITHUB_TOKEN')) {
    metadata.versions = await getCommitHistory(slug, options)

    if (
      metadata.versions.length > 0 &&
      await isDraftVersion(slug, text, metadata.versions[0], options)
    ) {
      metadata.versions.unshift({
        sha: 'draft',
        shortSha: 'draft',
        message: 'Uncommited version',
        date: new Date().toISOString(),
        author: '',
        verified: false,
      })
    }
  }

  // Update cache
  await writeCache(options, [slug, hash], { metadata, html })

  return {
    ...metadata,
    content: html,
  }
}

// Functions to get the posts and handle caching
async function getHashForFile(filePath: string): Promise<string> {
  const file = await Deno.readFile(filePath)
  const fileHashBuffer = await crypto.subtle.digest('SHA-256', file)
  return encodeHex(fileHashBuffer)
}

// Utility to read and write cache based on backend configuration
export async function writeCache(
  options: InternalOptions,
  key: Array<string>,
  value: { metadata: Omit<Post, 'content'>; html: string },
): Promise<void> {
  if (options.cacheBackend === 'filesystem') {
    await ensureDir(join(options.contentDir, '.cache'))
    await Deno.writeTextFile(
      join(options.contentDir, '.cache', `${key[0]}-${key[1]}.json`),
      JSON.stringify(value),
    )
  } else if (options.cacheBackend === 'kv') {
    const kv = await Deno.openKv()
    await kv.set(key, value)
  }
}

export async function readCache(
  options: InternalOptions,
  key: Array<string>,
): Promise<{ metadata: Omit<Post, 'content'>; html: string } | null> {
  if (options.cacheBackend === 'filesystem') {
    const cachePath = join(
      options.contentDir,
      '.cache',
      `${key[0]}-${key[1]}.json`,
    )
    if (await exists(cachePath)) {
      const cachedContent = await Deno.readTextFile(cachePath)
      return JSON.parse(cachedContent)
    }
  } else if (options.cacheBackend === 'kv') {
    const kv = await Deno.openKv()
    const result = await kv.get<
      { metadata: Omit<Post, 'content'>; html: string }
    >(key)
    if (result) return result.value
  }
  return null
}

/**
 * Calculates the reading time for a given html content.
 * @param {string} html - The post content.
 * @returns {number} - Estimated reading time in minutes.
 */
export function calculateReadingTime(html: string): number {
  const textContent =
    new DOMParser().parseFromString(html, 'text/html')?.textContent ?? ''

  const wordCount =
    textContent.replace(/[-*\s\n]+/gm, ' ').split(/\s/).length ?? 0

  // Calculate the reading time in minutes
  return Math.ceil(wordCount / WPM)
}
