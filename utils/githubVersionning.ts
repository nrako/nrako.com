import { decode as decodeBase64 } from 'https://deno.land/std@0.168.0/encoding/base64.ts'
import type { InternalOptions, Post } from './blogData.ts'
import { calculateReadingTime, readCache, writeCache } from './blogData.ts'
import processor from './processor.ts'

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
const ENV = Deno.env.get('ENV') || 'production' // Default to 'production' if not set

export interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  date: string
  author: string
  verified: boolean
}

/**
 * Fetches the commit history for a specific post file, using local Git logs if in development mode.
 * @param {string} slug - The slug of the post.
 * @returns {Promise<CommitInfo[]>} - An array of commit information.
 */
export async function getCommitHistory(
  slug: string,
  options: InternalOptions,
): Promise<CommitInfo[]> {
  if (!options.versionning) throw new Error('Versionning is not enabled')
  const filePath = `posts/${slug}.md`

  // Use local Git history in development.
  if (ENV === 'development') {
    return getLocalCommitHistory(filePath, options.versionning.mainBranch)
  }

  // Otherwise, use the GitHub API in production.
  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is required in production environment')
    return []
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${options.versionning.repoOwner}/${options.versionning.repoName}/${options.versionning.mainBranch}/commits?path=${filePath}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      },
    )

    if (!response.ok) {
      console.error('Failed to fetch commit history:', await response.text())
      return []
    }

    const commitData = await response.json() as Array<{
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
 * Retrieves the local commit history for a file using Git commands, only available in development mode.
 * @param {string} filePath - The path to the file.
 * @param {string} branch - The name of the main branch by default 'main'.
 * @returns {Promise<CommitInfo[]>} - An array of commit information.
 */
async function getLocalCommitHistory(
  filePath: string,
  branch: string = 'main',
): Promise<CommitInfo[]> {
  try {
    const cmd = new Deno.Command('git', {
      args: [
        'log',
        `${branch}`,
        '--pretty=format:%H|%s|%an|%ad|%G?',
        '--date=iso',
        filePath,
      ],
    })

    const { stdout } = await cmd.output()
    const log = new TextDecoder().decode(stdout)
    if (!log) return []
    const commits = log.split('\n').map((line) => {
      const [sha, message, author, date, verifiedFlag] = line.split('|')
      return {
        sha,
        shortSha: sha.substring(0, 7),
        message,
        author,
        date,
        verified: verifiedFlag === 'G', // "G" indicates a verified signature in Git
      }
    })

    return commits
  } catch (error) {
    console.error('Error fetching local commit history:', error)
    return []
  }
}

/**
 * Fetches the content of a specific version of a post from GitHub.
 * @param {string} slug - The slug of the post.
 * @param {string} sha - The SHA of the commit representing the version.
 * @returns {Promise<string | null>} - The content of the post at the specified version.
 */
export async function getPostContentAtVersion(
  slug: string,
  sha: string,
  options: InternalOptions,
): Promise<string | null> {
  if (!options.versionning) throw new Error('Versionning is not enabled')

  if (ENV === 'development') {
    return getLocalPostContentAtVersion(`posts/${slug}.md`, sha)
  }

  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is required in production environment')
    return null
  }

  const filePath = `posts/${slug}.md`

  try {
    const response = await fetch(
      `https://api.github.com/repos/${options.versionning.repoOwner}/${options.versionning.repoName}/contents/${filePath}?ref=${sha}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
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

    const contentData = await response.json()
    const decodedContent = new TextDecoder().decode(
      decodeBase64(contentData.content),
    )

    return decodedContent
  } catch (error) {
    console.error('Error fetching post content at version:', error)
    return null
  }
}

/**
 * Fetches the content of a specific version of a post using local Git, only in development mode.
 * @param {string} filePath - The path to the file.
 * @param {string} sha - The SHA of the commit.
 * @returns {Promise<string | null>} - The content of the post at the specified version.
 */
async function getLocalPostContentAtVersion(
  filePath: string,
  sha: string,
): Promise<string | null> {
  try {
    const cmd = new Deno.Command('git', {
      args: ['show', `${sha}:${filePath}`],
    })

    const { stdout } = await cmd.output()
    return new TextDecoder().decode(stdout)
  } catch (error) {
    console.error(`Error fetching content for ${filePath} at ${sha}:`, error)
    return null
  }
}

/**
 * Determines if the current content is a draft (i.e., is content is different to the latest commit).
 * @param {string} slug - The slug of the post.
 * @param {string} currentContent - The current content of the Markdown file.
 * @param {CommitInfo} latestCommit - The latest commit to compare against.
 * @returns {Promise<boolean>} - True if the current content is a draft, false otherwise.
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
    return true // Unable to retrieve content means we assume changes.
  }

  // Compare the current content with the content of the latest commit.
  return latestContent.trim() !== currentContent.trim()
}

/**
 * Fetches the post data for a specific version (SHA) from GitHub.
 * Caches the result to avoid repeated API calls.
 * @param {string} slug - The slug of the post.
 * @param {string} sha - The short SHA of the commit.
 * @param {object} options - Options, including cache paths.
 * @returns {Promise<Post | null>} - The post content or null if not found.
 */
export async function getPostAtVersion(
  slug: string,
  sha: string,
  options: InternalOptions,
): Promise<Post | null> {
  if (!options.versionning) throw new Error('Versionning is not enabled')

  const cacheKey = [slug, options.versionning.provider, sha]

  const cachedContent = await readCache(options, cacheKey)
  if (cachedContent) {
    return { ...cachedContent.metadata, content: cachedContent.html }
  }

  const content = await getPostContentAtVersion(slug, sha, options)

  if (!content) return null

  // Process the content (extract frontmatter, parse markdown, etc.)
  const { frontmatter, html, messages } = await processor(
    content,
    options,
  )

  // Cache the fetched content.
  const metadata = {
    slug,
    frontmatter,
    messages,
    readingTimeMinutes: calculateReadingTime(html),
  }

  await writeCache(options, cacheKey, { metadata, html })

  return { ...metadata, content: html }
}
