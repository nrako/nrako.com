import type { InternalOptions, Post } from './blogData.ts'
import { calculateReadingTime } from './blogData.ts'
import processor from './processor.ts'
import process from 'node:process'
import { Buffer } from 'node:buffer'

export interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  date: string
  author: string
  verified: boolean
}

function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN
}

/**
 * Fetches the commit history for a specific post file from GitHub API.
 */
export async function getCommitHistory(
  slug: string,
  options: InternalOptions,
): Promise<CommitInfo[]> {
  if (!options.versioning) throw new Error('Versioning is not enabled')

  const token = getGitHubToken()
  const filePath = `posts/${slug}.md`

  if (!token) {
    console.warn('GITHUB_TOKEN not set, skipping version history')
    return []
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${options.versioning.repoOwner}/${options.versioning.repoName}/commits?path=${filePath}&sha=${options.versioning.mainBranch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'nrako-website',
        },
      },
    )

    if (!response.ok) {
      console.error('Failed to fetch commit history:', await response.text())
      return []
    }

    const commitData = (await response.json()) as Array<{
      sha: string
      commit: {
        message: string
        author: { name: string }
        committer: { date: string }
        verification: { verified: boolean }
      }
    }>

    return commitData.map((commit) => ({
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      date: commit.commit.committer.date,
      author: commit.commit.author.name,
      verified: commit.commit.verification.verified,
    }))
  } catch (error) {
    console.error('Error fetching commit history:', error)
    return []
  }
}

/**
 * Fetches the raw content of a post at a specific version from GitHub.
 */
export async function getPostContentAtVersion(
  slug: string,
  sha: string,
  options: InternalOptions,
): Promise<string | null> {
  if (!options.versioning) throw new Error('Versioning is not enabled')

  const token = getGitHubToken()

  if (!token) {
    console.error('GITHUB_TOKEN is required to fetch versioned content')
    return null
  }

  const filePath = `posts/${slug}.md`

  try {
    const response = await fetch(
      `https://api.github.com/repos/${options.versioning.repoOwner}/${options.versioning.repoName}/contents/${filePath}?ref=${sha}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'nrako-website',
        },
      },
    )

    if (!response.ok) {
      console.error(
        'Failed to fetch content at version:',
        await response.text(),
      )
      return null
    }

    const contentData = (await response.json()) as { content: string }

    // GitHub returns base64-encoded content
    // Use Buffer in Node.js or atob in browser/CF Workers
    const decodedContent = typeof Buffer !== 'undefined'
      ? Buffer.from(contentData.content, 'base64').toString('utf-8')
      : atob(contentData.content)

    return decodedContent
  } catch (error) {
    console.error('Error fetching post content at version:', error)
    return null
  }
}

/**
 * Determines if the current content differs from the latest committed version.
 */
export async function isDraftVersion(
  slug: string,
  currentContent: string,
  latestCommit: CommitInfo,
  options: InternalOptions,
): Promise<boolean> {
  const latestContent = await getPostContentAtVersion(
    slug,
    latestCommit.sha,
    options,
  )

  if (latestContent === null) {
    return true // Unable to retrieve content means we assume changes
  }

  return latestContent.trim() !== currentContent.trim()
}

/**
 * Cache key for versioned posts
 */
function getCacheKey(slug: string, sha: string): string {
  return `https://nrako.com/cache/posts/${slug}/${sha}`
}

/**
 * Try to get cached content using Cloudflare Cache API.
 * Returns null if not in cache or Cache API not available.
 */
async function getCachedContent(
  slug: string,
  sha: string,
): Promise<Post | null> {
  // Cache API is only available in Cloudflare Workers
  if (typeof caches === 'undefined') {
    return null
  }

  try {
    const cache = caches.default
    const cacheKey = getCacheKey(slug, sha)
    const response = await cache.match(cacheKey)

    if (response) {
      return response.json()
    }
  } catch (error) {
    console.error('Cache read error:', error)
  }

  return null
}

/**
 * Store content in Cloudflare Cache API.
 * Cache for 1 year since versioned content never changes.
 */
async function setCachedContent(
  slug: string,
  sha: string,
  post: Post,
): Promise<void> {
  // Cache API is only available in Cloudflare Workers
  if (typeof caches === 'undefined') {
    return
  }

  try {
    const cache = caches.default
    const cacheKey = getCacheKey(slug, sha)

    const response = new Response(JSON.stringify(post), {
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 year - versioned content is immutable
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

    await cache.put(cacheKey, response)
  } catch (error) {
    console.error('Cache write error:', error)
  }
}

/**
 * Fetches and processes a post at a specific version (SHA).
 * Uses Cloudflare Cache API for caching in production.
 */
export async function getPostAtVersion(
  slug: string,
  sha: string,
  options: InternalOptions,
): Promise<Post | null> {
  if (!options.versioning) throw new Error('Versioning is not enabled')

  // Try cache first
  const cached = await getCachedContent(slug, sha)
  if (cached) {
    return cached
  }

  // Fetch from GitHub
  const content = await getPostContentAtVersion(slug, sha, options)
  if (!content) return null

  // Process the markdown content
  const { frontmatter, html, messages } = await processor(content, options)

  const post: Post = {
    slug,
    frontmatter,
    content: html,
    messages,
    readingTimeMinutes: calculateReadingTime(html),
  }

  // Cache the processed content
  await setCachedContent(slug, sha, post)

  return post
}
