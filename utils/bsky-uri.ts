import { AtpAgent } from '@atproto/api'

const agent = new AtpAgent({
  service: 'https://public.api.bsky.app',
})

function extractPostId(url: string): { handle: string; rkey: string } | null {
  try {
    // Handle URLs like https://bsky.app/profile/nrako.bsky.social/post/3kh3gxwn2if2d
    const match = url.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/)
    if (!match) return null
    return {
      handle: match[1],
      rkey: match[2],
    }
  } catch {
    return null
  }
}

async function getAtUri(url: string): Promise<string | null> {
  const parsed = extractPostId(url)
  if (!parsed) {
    console.error('Invalid BlueSky post URL')
    return null
  }

  try {
    const { data: profile } = await agent.getProfile({ actor: parsed.handle })
    const atUri = `at://${profile.did}/app.bsky.feed.post/${parsed.rkey}`
    return atUri
  } catch (error) {
    console.error('Error fetching BlueSky post:', error)
    return null
  }
}

// CLI entry point
if (import.meta.main) {
  const url = Deno.args[0]
  if (!url) {
    console.error('Please provide a BlueSky post URL')
    Deno.exit(1)
  }

  const atUri = await getAtUri(url)
  if (atUri) {
    console.log(atUri)
  } else {
    Deno.exit(1)
  }
}
