# nrako.com

Personal website for [@nrako](https://github.com/nrako).

Built with [Astro](https://astro.build) v7 + Preact + TailwindCSS v4.
Runs on [Node.js](https://nodejs.org) with [pnpm](https://pnpm.io) and deploys
to [Cloudflare Workers](https://workers.cloudflare.com) via
[@astrojs/cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).

## Prerequisites

- Node `>= 22.23.4`
- pnpm `11` (version pinned by `packageManager` in `package.json`)

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
pnpm run lint            # ESLint
pnpm run format          # Prettier
pnpm run test:e2e        # Playwright e2e (chromium/firefox/webkit/mobile-chrome)
pnpm run deploy          # Build + wrangler deploy
```

See [`CLAUDE.md`](./CLAUDE.md) for architecture notes, runtime caveats and
deployment details.

## License

See [LICENSE.md](./LICENSE.md).
