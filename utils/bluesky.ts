import { AtpAgent } from '@atproto/api'
import type { AppBskyFeedGetPostThread } from '@atproto/api'

const agent = new AtpAgent({
  service: 'https://public.api.bsky.app',
})

export async function getPostInteractions(
  postUri: string,
): Promise<AppBskyFeedGetPostThread.Response | null> {
  try {
    return await agent.getPostThread({
      uri: postUri,
      depth: 3,
    })
  } catch (error) {
    console.error('Error fetching BlueSky post:', error)
    return null
  }
}
