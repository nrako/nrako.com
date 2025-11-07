/// <reference lib="deno.unstable" />
import { App, fsRoutes, staticFiles } from 'fresh'
import { define, type State } from './utils.ts'

export const app = new App<State>()
app.use(staticFiles())

// Redirect www to non-www
const redirectWwwMiddleware = define.middleware((ctx) => {
  const url = new URL(ctx.req.url)
  if (url.hostname === 'www.nrako.com') {
    url.hostname = 'nrako.com'
    return Response.redirect(url.toString(), 301)
  }
  return ctx.next()
})
app.use(redirectWwwMiddleware)

// this is the same as the /api/:name route defined via a file. feel free to delete this!
app.get('/api2/:name', (ctx) => {
  const name = ctx.params.name
  return new Response(
    `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`,
  )
})

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`)
  return ctx.next()
})
app.use(exampleLoggerMiddleware)

await fsRoutes(app, {
  dir: './',
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
})

if (import.meta.main) {
  await app.listen()
}
