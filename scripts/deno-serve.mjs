import { handle } from '../dist/server/entry.mjs'

const port = Number(Deno.env.get('PORT') ?? '8085')

Deno.serve({ port }, async (req) => {
  const url = new URL(req.url)
  console.error(`-> ${req.method} ${url.pathname}`)
  try {
    const res = await handle(req)
    console.error(`<- ${res.status}`)
    return res
  } catch (e) {
    console.error('ERR', e)
    return new Response(String(e), { status: 500 })
  }
})
