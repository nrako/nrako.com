# nrako.com

Personal website for [@nrako](https://github.com/nrako).

Built with [Astro](https://astro.build) v6 + Preact + TailwindCSS v4.
Runs on [Deno](https://deno.com) (no npm CLI required) and deploys to
[Cloudflare Workers](https://workers.cloudflare.com) via
[@deno/astro-adapter](https://github.com/denoland/deno-astro-adapter).

## Prerequisites

- Deno `>= 2.7` — <https://docs.deno.com/runtime/manual/getting_started/installation>
- Node `>= 22` on PATH (only required by tooling that wraps Node bins)

## Setup

```bash
deno install --allow-scripts
```

This populates `node_modules/` from `deno.lock`. **Do not run `npm install`** —
Deno owns `node_modules/` and npm's hoisting layout will conflict with it.

## Common tasks

```bash
deno task dev            # Astro dev server on localhost:4321
deno task build          # Production build (dist/client + dist/server)
deno task preview        # wrangler dev against the built worker
deno task serve          # Pure-Deno preview (Deno.serve + handle())
deno task check          # Astro type check
deno task lint           # deno lint
deno task format         # deno fmt
deno task test:e2e       # Playwright e2e (chromium/firefox/webkit/mobile-chrome)
deno task deploy         # Build + wrangler deploy
```

See [`CLAUDE.md`](./CLAUDE.md) for architecture notes, runtime caveats and
deployment details.

## License

See [LICENSE.md](./LICENSE.md).
