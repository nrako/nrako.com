import type { PageFrontmatter } from 'myst-frontmatter'
import type { Messages } from './processor'
import type { CommitInfo } from './githubVersioning'
import type { PostManifestEntry, PostsManifest } from './manifest'
import { extname, join } from 'node:path'
import processor from './processor'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parseHTML } from 'linkedom'
import { getCommitHistory, isDraftVersion } from './githubVersioning'
import { getPostFromManifest, getAllPostsFromManifest } from './manifest'

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
  contentDir: './posts',
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
  jsFilename: 'freshblog.js',
  showAuthors: 'only_in_posts',
  versioning: {
    provider: 'github',
    mainBranch: 'main',
    repoOwner: 'nrako',
    repoName: 'nrako.com',
  },
}

/**
 * Check if filesystem is available (build time or dev, not CF Workers runtime)
 */
function isFilesystemAvailable(): boolean {
  try {
    // In Cloudflare Workers, existsSync won't work
    return typeof existsSync === 'function'
  } catch {
    return false
  }
}

/**
 * Get all posts.
 * - At build time / dev: reads from filesystem
 * - At SSR runtime (CF Workers): reads from manifest
 */
export async function getPosts(
  options: InternalOptions = defaultOptions,
): Promise<Post[]> {
  // Try filesystem first (works at build time and dev)
  if (isFilesystemAvailable()) {
    try {
      return await getPostsFromFilesystem(options)
    } catch {
      // Filesystem failed, fall through to manifest
    }
  }

  // Fall back to manifest (SSR runtime in CF Workers)
  const manifestPosts = await getAllPostsFromManifest()
  if (manifestPosts.length > 0) {
    return manifestPosts.map((entry) => ({
      slug: entry.slug,
      frontmatter: entry.frontmatter,
      content: '', // Content not needed for listings
      messages: { errors: [], warnings: [] },
      readingTimeMinutes: entry.readingTimeMinutes,
      versions: entry.versions,
    }))
  }

  return []
}

/**
 * Get a single post by slug.
 * - At build time / dev: reads from filesystem
 * - At SSR runtime (CF Workers): uses manifest for metadata
 */
export async function getPost(
  slug: string,
  options: InternalOptions = defaultOptions,
): Promise<Post | null> {
  // Try filesystem first (works at build time and dev)
  if (isFilesystemAvailable()) {
    try {
      return await getPostFromFilesystem(slug, options)
    } catch {
      // Filesystem failed, fall through to manifest
    }
  }

  // Fall back to manifest (SSR runtime in CF Workers)
  // Note: For versioned posts, use getPostAtVersion from githubVersioning
  const manifestEntry = await getPostFromManifest(slug)
  if (manifestEntry) {
    return {
      slug: manifestEntry.slug,
      frontmatter: manifestEntry.frontmatter,
      content: '', // Content must be fetched separately for SSR
      messages: { errors: [], warnings: [] },
      readingTimeMinutes: manifestEntry.readingTimeMinutes,
      versions: manifestEntry.versions,
    }
  }

  return null
}

/**
 * Read all posts from the filesystem (build-time only)
 */
export async function getPostsFromFilesystem(
  options: InternalOptions = defaultOptions,
): Promise<Post[]> {
  const files = readdirSync(options.contentDir, { withFileTypes: true })
  const promises = []

  for (const fileOrFolder of files) {
    if (fileOrFolder.isDirectory()) continue
    if (extname(fileOrFolder.name) !== '.md') continue
    const slug = fileOrFolder.name.replace('.md', '')
    promises.push(getPostFromFilesystem(slug, options))
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
 * Read a single post from the filesystem (build-time only)
 */
export async function getPostFromFilesystem(
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
 * Generate a hash for a file's content
 */
export function getHashForFile(filePath: string): string {
  const file = readFileSync(filePath)
  return createHash('sha256').update(file).digest('hex').substring(0, 16)
}

/**
 * Generate the posts manifest (called at build time)
 */
export async function generateManifest(
  options: InternalOptions = defaultOptions,
): Promise<PostsManifest> {
  const posts = await getPostsFromFilesystem(options)

  const manifestEntries: PostManifestEntry[] = posts.map((post) => ({
    slug: post.slug,
    frontmatter: post.frontmatter,
    readingTimeMinutes: post.readingTimeMinutes,
    versions: post.versions ?? [],
    contentHash: getHashForFile(join(options.contentDir, `${post.slug}.md`)),
  }))

  return {
    generatedAt: new Date().toISOString(),
    posts: manifestEntries,
  }
}

/**
 * Write the manifest to a file (called at build time)
 */
export async function writeManifest(
  outputPath: string,
  options: InternalOptions = defaultOptions,
): Promise<void> {
  const manifest = await generateManifest(options)
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2))
  console.log(
    `[manifest] Generated posts-manifest.json with ${manifest.posts.length} posts`,
  )
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
