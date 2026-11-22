import type { PageFrontmatter } from 'myst-frontmatter'
import type { Messages } from './processor.ts'
import type { CommitInfo } from './githubVersioning.ts'
import { extname, join } from 'node:path'
import processor from './processor.ts'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { parseHTML } from 'linkedom'
import { getCommitHistory, isDraftVersion } from './githubVersioning.ts'
import process from 'node:process'

// 200 word-per-minute is on the lower range of the average reading speed 200-300 wpm
const WPM = 200

export interface InternalOptions {
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
   * Path to folder containing the markdown (*.md) files. The `POSTS_DIR`
   * environment variable overrides it, which the e2e tests use to build the
   * site from fixture posts.
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
   * Configure versioning
   */
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
  readingTimeMinutes: number
  versions?: CommitInfo[]
}

export const defaultOptions: InternalOptions = {
  title: "Nicholas's Posts",
  description: 'All my posts as seen on nrako.com',
  language: 'en',
  contentDir: process.env.POSTS_DIR || './posts',
  favicon: '/favicon.ico',
  copyright: 'Copyright 2024 www.nrako.com',
  generator: 'Feed (https://github.com/jpmonette/feed) for Node.js',
  highlighter: {
    themes: {
      light: 'material-theme-lighter',
      dark: 'material-theme-darker',
    },
  },
  cssFilename: 'freshblog.css',
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
  options: InternalOptions = defaultOptions,
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
  options: InternalOptions = defaultOptions,
): Promise<Post | null> {
  const filePath = join(options.contentDir, `${slug}.md`)
  if (!existsSync(filePath)) return null

  const text = readFileSync(filePath, 'utf-8')
  const { frontmatter, html, messages } = await processor(text, options)

  const metadata: Post = {
    slug,
    frontmatter,
    content: html,
    messages,
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
