import { execFile } from 'node:child_process'
import { posix } from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'

import type { BlogOptions, Post } from './blogData.ts'
import { calculateReadingTime } from './blogData.ts'
import { versionPath } from './permalinks.ts'
import processor from './processor.ts'
import { fetchPage } from './quotes.ts'

export interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  date: string
  /** The commit's author, by the name `.mailmap` gives them */
  author: string
  /** Whether git checked the commit's signature as good (`%G?` is `G`) */
  verified: boolean
}

/**
 * Where a post's history is read: the local git repository the site is built
 * from, at a ref whose commits stay, so that a permalink keeps its commit.
 */
export interface VersioningOptions {
  /** A directory of the repository; the working directory when absent */
  cwd?: string
  /** The ref the history is read from, e.g. `refs/remotes/origin/main` */
  ref: string
  /** The posts' directory, from the root of the repository */
  postsPath: string
  /**
   * Whether every file of the posts' directory has to be as `ref` has it: a
   * build to deploy, which must not publish a draft
   */
  published?: boolean
  /** The repository on GitHub, which a version's page links its commit to */
  repoOwner: string
  repoName: string
}

const execGit = promisify(execFile)

async function git(
  options: VersioningOptions,
  args: string[],
): Promise<string> {
  const { stdout } = await execGit(
    'git',
    ['-C', options.cwd ?? process.cwd(), ...args],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  )
  return stdout
}

/**
 * The commit the history is read from. A shallow clone fails: its history
 * stops at its depth, and the versions before would be missing without a
 * word, along with their pages.
 */
async function historyTip(options: VersioningOptions): Promise<string> {
  let shallow: string
  try {
    shallow = await git(options, ['rev-parse', '--is-shallow-repository'])
  } catch (error) {
    throw new Error(
      'Cannot read the history of the posts: not in a git repository',
      { cause: error },
    )
  }
  if (shallow.trim() === 'true') {
    throw new Error(
      'Cannot read the history of the posts from a shallow clone: fetch the whole history (`git fetch --unshallow`, or `fetch-depth: 0` in CI)',
    )
  }

  try {
    const tip = await git(options, [
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${options.ref}^{commit}`,
    ])
    return tip.trim()
  } catch (error) {
    throw new Error(
      `Cannot read the history of the posts from ${options.ref}: it is not a commit of the repository (fetch it, e.g. \`git fetch origin main\`)`,
      { cause: error },
    )
  }
}

function postPath(path: string, options: VersioningOptions): string {
  return posix.join(options.postsPath, path)
}

/**
 * The commits of `options.ref` that change a post's file, newest first. A
 * commit that deletes the file is left out: it has no version to show. A post
 * deleted and later added again keeps the versions it had before.
 */
export async function getCommitHistory(
  slug: string,
  options: VersioningOptions,
): Promise<CommitInfo[]> {
  const tip = await historyTip(options)
  const log = await git(options, [
    'log',
    '-z',
    '--diff-filter=d',
    '--format=%H%x1f%cI%x1f%aN%x1f%G?%x1f%B',
    tip,
    '--',
    postPath(`${slug}.md`, options),
  ])

  return log
    .split('\0')
    .filter((record) => record !== '')
    .map((record) => {
      const [sha = '', date = '', author = '', signature = '', ...message] =
        record.split('\x1f')
      return {
        sha,
        shortSha: sha.substring(0, 7),
        message: message.join('\x1f').trimEnd(),
        date,
        author,
        verified: signature === 'G',
      }
    })
}

/**
 * The files of the posts' directory that are not as `options.ref` has them,
 * by their path from the root of the repository: changed, staged, committed
 * but not pushed, deleted, or new and not ignored.
 */
export async function unpublishedFiles(
  options: VersioningOptions,
): Promise<string[]> {
  const tip = await historyTip(options)
  const directory = postPath('', options)
  const changed = await git(options, [
    'diff',
    '--name-only',
    '-z',
    tip,
    '--',
    directory,
  ])
  const untracked = await git(options, [
    'ls-files',
    '--others',
    '--exclude-standard',
    '--full-name',
    '-z',
    '--',
    directory,
  ])
  return [...changed.split('\0'), ...untracked.split('\0')]
    .filter((path) => path !== '')
    .sort()
}

/**
 * Fails when a build to deploy (`options.published`) would publish a post
 * that is not committed and pushed: a draft has no permalink, and what it
 * says is in no commit.
 */
export async function assertPublished(
  options: VersioningOptions,
): Promise<void> {
  if (!options.published) return
  const files = await unpublishedFiles(options)
  if (files.length > 0) {
    throw new Error(
      `Cannot deploy posts that are not as ${options.ref} has them; commit and push them first:\n${files.map((file) => `  ${file}`).join('\n')}`,
    )
  }
}

/**
 * A file of the posts directory, by its path from that directory, as it is
 * at a commit, or undefined when the commit has no such file.
 */
async function readFileAtVersion(
  path: string,
  sha: string,
  options: VersioningOptions,
): Promise<string | undefined> {
  let blob: string
  try {
    blob = await git(options, [
      'rev-parse',
      '--verify',
      '--quiet',
      '--end-of-options',
      `${sha}:${postPath(path, options)}`,
    ])
  } catch (error) {
    // `--quiet` exits with 1, and says nothing, when there is no such file
    if ((error as { code?: unknown }).code === 1) return undefined
    throw error
  }
  return git(options, ['cat-file', 'blob', blob.trim()])
}

/**
 * Whether a post's file differs from its latest commit. That commit is listed
 * in the post's history: failing to read it fails the build.
 */
export async function isDraftVersion(
  slug: string,
  currentContent: string,
  latestCommit: CommitInfo,
  options: VersioningOptions,
): Promise<boolean> {
  const latestContent = await readFileAtVersion(
    `${slug}.md`,
    latestCommit.sha,
    options,
  )
  if (latestContent === undefined) {
    throw new Error(
      `Could not read version ${latestCommit.shortSha} of post "${slug}" from git`,
    )
  }
  return latestContent.trim() !== currentContent.trim()
}

/** The posts at a version, by `slug@sha`, each read once per build */
const postsAtVersion = new Map<string, Promise<Post | null>>()

/**
 * Reads and processes a post at a specific version (SHA). The version page
 * and the pages of its snippets all ask for it: it is read and processed
 * once, and the others get the same post.
 */
export function getPostAtVersion(
  slug: string,
  sha: string,
  options: BlogOptions,
): Promise<Post | null> {
  if (!options.versioning) throw new Error('Versioning is not enabled')

  const key = `${slug}@${sha}`
  let post = postsAtVersion.get(key)
  if (!post) {
    post = loadPostAtVersion(slug, sha, options, options.versioning)
    postsAtVersion.set(key, post)
  }
  return post
}

async function loadPostAtVersion(
  slug: string,
  sha: string,
  options: BlogOptions,
  versioning: VersioningOptions,
): Promise<Post | null> {
  const content = await readFileAtVersion(`${slug}.md`, sha, versioning)
  if (content === undefined) return null

  // The files the post refers to are read at the same version as the post
  const { frontmatter, html, messages, snippets, tableOfContents } =
    await processor(content, {
      ...options,
      // The pages of its snippets are those of this version
      address: versionPath(slug, sha),
      loadFile(path) {
        return readFileAtVersion(path, sha, versioning)
      },
      // What a quote quotes is read from its page as it is now, at any
      // version of the post
      fetchPage,
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
