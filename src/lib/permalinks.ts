import type { CommitInfo } from './githubVersioning.ts'
import { snippetAddress } from './snippets.ts'

/** The page of a post, which shows it as it is now */
export function postPath(slug: string): string {
  return `/posts/${slug}`
}

/** The page of a post at one of its versions: its permalink */
export function versionPath(slug: string, shortSha: string): string {
  return `/posts/${slug}/${shortSha}`
}

/**
 * The latest committed version of a post, which has a page. The `draft` entry
 * of a post whose file differs from its last commit is not one.
 */
export function latestVersion(
  versions: CommitInfo[] | undefined,
): CommitInfo | undefined {
  return versions?.find((version) => version.sha !== 'draft')
}

export interface PostLinks {
  /** `rel="canonical"` (RFC 6596): the post's page, from each of its pages */
  canonical: string
  /**
   * `rel="cite-as"` (RFC 8574): the permalink of the version the page shows,
   * when it shows a committed one
   */
  citeAs?: string
}

/**
 * The links a page of a post declares about itself, as absolute URLs.
 *
 * The post's page is canonical and cites the latest version, unless what it
 * shows is no version: it then has no permalink. The page of a version has the
 * post's page as canonical and cites itself.
 */
export function postLinks({
  site,
  slug,
  versions,
  shortSha,
}: {
  /** Origin of the site (`site` in the Astro config) */
  site: URL | string
  slug: string
  /** The post's versions, newest first, a `draft` entry included */
  versions: CommitInfo[] | undefined
  /** The version the page shows; none for the post's page */
  shortSha?: string
}): PostLinks {
  const absolute = (path: string) => new URL(path, site).href
  const canonical = absolute(postPath(slug))

  if (shortSha !== undefined) {
    return { canonical, citeAs: absolute(versionPath(slug, shortSha)) }
  }

  // The post's page shows its file, which is the latest commit unless the
  // newest entry is the draft
  const shown = versions?.[0]
  if (!shown || shown.sha === 'draft') return { canonical }

  return { canonical, citeAs: absolute(versionPath(slug, shown.shortSha)) }
}

/** The links a snippet's page declares, under those of its post's page */
export interface SnippetLinks {
  /** The snippet's page under the post's, when the post still has it */
  canonical?: string
  /** The snippet's page under the version its page shows */
  citeAs?: string
}

/**
 * The links a snippet's page declares about itself, as absolute URLs: those
 * of the page of the post it is under (`postLinks`), with the snippet's
 * address under each.
 *
 * A version's snippet whose label the post no longer has declares no
 * canonical page: it would be one that does not exist.
 */
export function snippetLinks({
  label,
  inPost,
  ...post
}: Parameters<typeof postLinks>[0] & {
  label: string
  /** Whether the post as it is now has a snippet of that label */
  inPost: boolean
}): SnippetLinks {
  const { canonical, citeAs } = postLinks(post)

  return {
    ...(inPost && { canonical: snippetAddress(canonical, label) }),
    ...(citeAs && { citeAs: snippetAddress(citeAs, label) }),
  }
}
