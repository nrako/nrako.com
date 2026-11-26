# nrako.com

Personal website for [@nrako](https://github.com/nrako).

Built with [Astro](https://astro.build) v7 + Preact + TailwindCSS v4.
Runs on [Node.js](https://nodejs.org) with [pnpm](https://pnpm.io) and deploys
to [Cloudflare Workers](https://workers.cloudflare.com) via
[@astrojs/cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).

## Prerequisites

Node.js and pnpm, at the versions pinned in [`mise.toml`](./mise.toml). With
[mise](https://mise.jdx.dev):

```bash
mise install
```

## Setup

```bash
pnpm install
```

Dependency install scripts do not run; see the security notes in
[`CLAUDE.md`](./CLAUDE.md).

## Common tasks

```bash
pnpm run dev             # Astro dev server on localhost:4321
pnpm run build           # Production build (dist/client + dist/server)
pnpm run preview         # Preview the built Worker locally in workerd
pnpm run check           # Astro type check
pnpm run lint            # Oxlint + ESLint
pnpm run format          # Oxfmt
pnpm run test:unit       # Unit tests of the post markup (node:test)
pnpm run test:e2e        # Playwright e2e (chromium/firefox/webkit/mobile-chrome)
pnpm run test:e2e:fixtures  # Same, with the site built from fixture posts
pnpm run deploy          # Build + wrangler deploy
```

See [`CLAUDE.md`](./CLAUDE.md) for architecture notes, runtime caveats and
deployment details.

## License

See [LICENSE.md](./LICENSE.md).
