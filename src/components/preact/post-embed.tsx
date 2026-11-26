import type {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
} from '@atproto/api'

import TbArrowUpRight from '@/components/icons/TbArrowUpRight'
import TbBrandBluesky from '@/components/icons/TbBrandBluesky'

import Avatar from './avatar.tsx'
import BskyAuthor from './bsky-author.tsx'
import ReactionBar from './reaction-bar.tsx'

// Type guard to check if the record has a text property
const hasText = (value: unknown): value is { text: string } =>
  typeof value === 'object' && value !== null && 'text' in value

function EmbedContent({ postUri }: { postUri: string }) {
  // Extract the post ID from the URI
  const postId = postUri.split('/').pop()

  // For AT protocol URIs, we need to extract the DID
  const match = postUri.match(/at:\/\/([^/]+)\//)
  const did = match ? match[1] : null

  if (!postId || !did) {
    console.warn('Invalid post URI:', postUri)
    return null
  }

  return (
    <a
      href={`https://bsky.app/profile/${did}/post/${postId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-x-2 rounded-lg border border-gray-200 bg-gray-100 p-2 text-sm text-gray-600 transition-colors hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
    >
      <TbBrandBluesky className="inline-block" />
      View content on Bluesky
      <TbArrowUpRight className="inline-block" />
    </a>
  )
}

function EmbedBskyPost({ embed }: { embed: AppBskyEmbedRecord.View }) {
  const record = embed.record as AppBskyEmbedRecord.ViewRecord

  return (
    <div className="mb-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
      <div className="mb-2 flex items-center space-x-2">
        <Avatar
          src={record.author.avatar}
          name={record.author.displayName ?? record.author.handle}
        />
        <BskyAuthor
          author={record.author}
          indexedAt={record.indexedAt}
          postUri={`https://bsky.app/profile/${record.author.handle}/post/${record.uri
            .split('/')
            .pop()}`}
        />
      </div>
      {hasText(record.value) && (
        <p className="mt-2 wrap-break-word text-gray-600 dark:text-gray-300">
          {record.value.text}
        </p>
      )}

      {typeof record.value === 'object' &&
        record.value !== null &&
        'embed' in record.value && <EmbedContent postUri={record.uri} />}

      <div className="mt-2">
        <ReactionBar
          likes={record.likeCount ?? 0}
          reposts={(record.repostCount ?? 0) + (record.quoteCount ?? 0)}
          replies={record.replyCount ?? 0}
          postUri={`https://bsky.app/profile/${record.author.handle}/post/${record.uri
            .split('/')
            .pop()}`}
        />
      </div>
    </div>
  )
}

interface Props {
  embed:
    | AppBskyEmbedImages.View
    | AppBskyEmbedVideo.View
    | AppBskyEmbedExternal.View
    | AppBskyEmbedRecord.View
    | AppBskyEmbedRecordWithMedia.View
    | { $type: string }
  postUri: string
}

export default function PostEmbed({ embed, postUri }: Props) {
  if (!embed || typeof embed.$type !== 'string') return null

  const type = embed.$type.replace('#view', '')

  // Handle BlueSky post embeds
  if (type === 'app.bsky.embed.record' && 'record' in embed) {
    // Handle not found records
    if (
      typeof embed.record === 'object' &&
      embed.record !== null &&
      '$type' in embed.record &&
      embed.record.$type === 'app.bsky.embed.record#viewNotFound'
    ) {
      return (
        <div className="mb-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-500 italic dark:bg-gray-800 dark:text-gray-400">
          Post not found
        </div>
      )
    }

    // Handle list view
    if (
      typeof embed.record === 'object' &&
      embed.record !== null &&
      '$type' in embed.record &&
      embed.record.$type === 'app.bsky.graph.defs#listView'
    ) {
      return <EmbedContent postUri={postUri} />
    }
    return <EmbedBskyPost embed={embed as AppBskyEmbedRecord.View} />
  }

  // For all other types of embeds, show a link to view on BlueSky
  return <EmbedContent postUri={postUri} />
}
