/**
 * Posts manifest - generated at build time, used at runtime for SSR pages.
 * This avoids filesystem operations in Cloudflare Workers.
 */

import type { PageFrontmatter } from 'myst-frontmatter'
import type { CommitInfo } from './githubVersioning.ts'

export interface PostManifestEntry {
  slug: string
  frontmatter: PageFrontmatter
  readingTimeMinutes: number
  versions: CommitInfo[]
  /** Hash of the source file content, used for cache invalidation */
  contentHash: string
}

export interface PostsManifest {
  generatedAt: string
  posts: PostManifestEntry[]
}

// In-memory cache of the manifest (loaded once per worker instance)
let manifestCache: PostsManifest | null = null

/**
 * Get the posts manifest. In production, this is loaded from the static
 * manifest file. In development, it returns null (use filesystem directly).
 */
export async function getManifest(): Promise<PostsManifest | null> {
  if (import.meta.env.DEV) {
    return null
  }

  if (manifestCache) {
    return manifestCache
  }

  try {
    // In production, the manifest is available as a static asset
    const response = await fetch(
      new URL('/posts-manifest.json', import.meta.env.SITE),
    )
    if (response.ok) {
      manifestCache = await response.json()
      return manifestCache
    }
  } catch (error) {
    console.error('Failed to load posts manifest:', error)
  }

  return null
}

/**
 * Get a single post entry from the manifest
 */
export async function getPostFromManifest(
  slug: string,
): Promise<PostManifestEntry | null> {
  const manifest = await getManifest()
  if (!manifest) return null

  return manifest.posts.find((p) => p.slug === slug) ?? null
}

/**
 * Get all posts from the manifest (sorted by date, newest first)
 */
export async function getAllPostsFromManifest(): Promise<PostManifestEntry[]> {
  const manifest = await getManifest()
  if (!manifest) return []

  return [...manifest.posts].sort(
    (a, b) =>
      Date.parse(b.frontmatter.date ?? '') -
      Date.parse(a.frontmatter.date ?? ''),
  )
}
