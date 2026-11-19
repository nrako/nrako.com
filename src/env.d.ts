/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Cloudflare Workers Cache API extension
// https://developers.cloudflare.com/workers/runtime-apis/cache/
declare global {
  interface CacheStorage {
    default: Cache
  }
}

export {}
