import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import process from 'node:process'

import { parseHTML } from 'linkedom'
import type { PageFrontmatter } from 'myst-frontmatter'

import { CODE_COLOR_REPLACEMENTS, CODE_THEMES } from './codeThemes.ts'
import type { CommitInfo, VersioningOptions } from './gitVersioning.ts'
import {
  assertPublished,
  getCommitHistory,
  isDraftVersion,
} from './gitVersioning.ts'
import type { Messages, PostFrontmatter } from './processor.ts'
import processor from './processor.ts'
import { fetchPage } from './quotes.ts'
import type { PostSnippet } from './snippets.ts'
import type { TableOfContentsEntry } from './tableOfContents.ts'

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
  /** Where the history of the posts is read, none when absent */
  versioning: VersioningOptions | undefined
}

export interface Post {
  /** slug of the post, derived from the filename */
  slug: string
  frontmatter: PostFrontmatter
  /** HTML content of the post */
  content: string
  messages: Messages
  /** The snippets of the post that have a page of their own */
  snippets: PostSnippet[]
  /** The sections of the post, in order */
  tableOfContents: TableOfContentsEntry[]
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
    themes: CODE_THEMES,
    colorReplacements: CODE_COLOR_REPLACEMENTS,
  },
  showAuthors: 'only_in_posts',
  versioning: {
    // Pushed commits only: a permalink names a commit that stays
    ref: 'refs/remotes/origin/main',
    // Under `posts/` whatever `POSTS_DIR` says: fixtures have no history
    postsPath: 'posts',
    // `pnpm run deploy` builds with `DEPLOY=1`: no draft is published
    published: process.env.DEPLOY === '1',
    repoOwner: 'nrako',
    repoName: 'nrako.com',
  },
}

/**
 * Get all posts, newest first, listed or not: every post has its pages. Reads
 * the filesystem, so it only runs in Node (build and dev), never in workerd.
 */
export async function getPosts(
  options: BlogOptions = defaultOptions,
): Promise<Post[]> {
  // A build to deploy fails on a post that is not committed and pushed
  if (options.versioning) await assertPublished(options.versioning)

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
 * Get the posts a listing or a feed shows, newest first: all of them but
 * those whose frontmatter says `listed: false`.
 */
export async function getListedPosts(
  options: BlogOptions = defaultOptions,
): Promise<Post[]> {
  const posts = await getPosts(options)
  return posts.filter((post) => post.frontmatter.listed !== false)
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
  const { frontmatter, html, messages, snippets, tableOfContents } =
    await processor(text, {
      ...options,
      address: `/posts/${slug}`,
      loadFile(path) {
        const file = join(options.contentDir, path)
        return existsSync(file) ? readFileSync(file, 'utf-8') : undefined
      },
      // What a quote quotes is read from its page
      fetchPage,
    })

  const metadata: Post = {
    slug,
    frontmatter,
    content: html,
    messages,
    snippets,
    tableOfContents,
    readingTimeMinutes: calculateReadingTime(html),
  }

  // The versions are read from git (only at build time or in dev)
  if (options.versioning) {
    metadata.versions = await getCommitHistory(slug, options.versioning)

    if (
      metadata.versions.length > 0 &&
      (await isDraftVersion(
        slug,
        text,
        metadata.versions[0],
        options.versioning,
      ))
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
