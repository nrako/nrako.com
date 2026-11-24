import type { BlogOptions, Post } from './blogData.ts'
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
  options: BlogOptions,
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
export function getPostContentAtVersion(
  slug: string,
  sha: string,
  options: BlogOptions,
): Promise<string | null> {
  return getFileAtVersion(`${slug}.md`, sha, options)
}

/**
 * Fetches the raw content of a file of the posts directory, by its path from
 * that directory, at a specific version from GitHub.
 */
async function getFileAtVersion(
  path: string,
  sha: string,
  options: BlogOptions,
): Promise<string | null> {
  if (!options.versioning) throw new Error('Versioning is not enabled')

  const token = getGitHubToken()

  if (!token) {
    console.error('GITHUB_TOKEN is required to fetch versioned content')
    return null
  }

  const filePath = `posts/${path}`

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
    const decodedContent =
      typeof Buffer !== 'undefined'
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
  options: BlogOptions,
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
 * Fetches and processes a post at a specific version (SHA).
 */
export async function getPostAtVersion(
  slug: string,
  sha: string,
  options: BlogOptions,
): Promise<Post | null> {
  if (!options.versioning) throw new Error('Versioning is not enabled')

  const content = await getPostContentAtVersion(slug, sha, options)
  if (!content) return null

  // The files the post refers to are read at the same version as the post
  const { frontmatter, html, messages, snippets, tableOfContents } =
    await processor(content, {
      ...options,
      // The pages of its snippets are those of the post as it is now
      address: `/posts/${slug}`,
      async loadFile(path) {
        return (await getFileAtVersion(path, sha, options)) ?? undefined
      },
    })

  return {
    slug,
    frontmatter,
    content: html,
    messages,
    snippets,
    tableOfContents,
    readingTimeMinutes: calculateReadingTime(html),
  }
}
