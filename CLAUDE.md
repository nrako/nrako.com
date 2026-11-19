# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website for nrako built with **Astro v7**, Preact, and TailwindCSS v4. Features a blog system using MyST markdown. Builds on Node.js with pnpm and deploys to Cloudflare Workers.

## Toolchain

- **Runtime**: Node.js >= 22.23.4 (CI uses Node 24)
- **Package manager**: pnpm 11 (pinned by `packageManager` in `package.json`; `pnpm-lock.yaml` is committed)
- **Formatter**: Prettier + `prettier-plugin-astro` (config in `package.json`)
- **Linter**: ESLint flat config (`eslint.config.js`): `@eslint/js`, `typescript-eslint`, `eslint-plugin-astro`
- **Builder**: Astro v7 (Vite 8)
- **Adapter**: `@astrojs/cloudflare` — provides the Worker entry (`@astrojs/cloudflare/entrypoints/server`)
- **Deploy**: `wrangler deploy` (Cloudflare Workers)

Use pnpm for every dependency change. Do not use `npm install`.

### Security model

Supply-chain trust is anchored at install time:

- **No dependency lifecycle scripts.** pnpm only runs install scripts allowed in `pnpm-workspace.yaml` (`allowBuilds`). `esbuild` and `workerd` are explicitly denied there; their native binaries ship as prebuilt optional dependencies, so the scripts are not needed. To allow an audited script, set its entry to `true`.
- **`pnpm-lock.yaml` integrity hashes.** CI installs with `--frozen-lockfile`; a tampered tarball is rejected.

There is no runtime sandbox: `dev` / `build` / `preview` / `test:e2e` / `deploy` run dependency code with the invoking user's full permissions. Treat the pinned dependency tree as trusted code and review lockfile changes accordingly.

`astro build` copies local `.env` values into `dist/server/.dev.vars` so `astro preview` can use them. `dist/` is gitignored and `wrangler deploy` uploads only the Worker modules and `dist/client/`; never publish `dist/server/` by other means.

## Commands

```bash
pnpm install                  # First-time setup (no install scripts run)
pnpm run dev                  # Astro dev server (localhost:4321)
pnpm run build                # Production build → dist/{client,server}
pnpm run preview              # Preview the built Worker locally in workerd
pnpm run check                # Astro type check
pnpm run lint                 # ESLint
pnpm run format               # Prettier (write)
pnpm run format:check         # Prettier (check)
pnpm run test:e2e             # Playwright e2e
pnpm run deploy               # Build + wrangler deploy
```

## Architecture

**Astro v7** with `output: 'static'`, server-rendering opt-in via `prerender: false` on individual pages.

**Pages** (`src/pages/`):

- `index.astro` — Homepage (static)
- `posts/index.astro` — Blog listing (static)
- `posts/[slug].astro` — Single post (static, prerendered)
- `posts/[slug]/[sha].astro` — Versioned post (SSR)
- `feed/[type].ts` — RSS/Atom/JSON feed endpoints (static)

**Layouts** (`src/layouts/`): `Layout.astro` (root, with header/footer/theme toggle).

**Preact Islands** (`src/components/preact/`, mounted with `client:load`):

- `hero-text.tsx`, `vim-replace-text.tsx`, `theme-toggle.tsx`
- Bluesky: `bluesky-interactions.tsx`, `author.tsx`, `reply.tsx`, `avatar.tsx`, `post-embed.tsx`, `reaction-bar.tsx`

**Blog System** (`src/lib/`):

- `blogData.ts` — Post loading, caching, reading time
- `processor.ts` — MyST markdown processing with Shiki syntax highlighting
- `githubVersioning.ts` — Post version history from GitHub commits
- `bluesky.ts` — Bluesky API integration
- `manifest.ts` — Build-time posts manifest reader

**Integrations** (`src/integrations/`): `posts-manifest.ts` — emits `public/posts-manifest.json` at build start so SSR pages can read post metadata without filesystem access on Cloudflare Workers.

**Content**: Blog posts in `posts/*.md` (MyST markdown + frontmatter).

## Runtime environments

| Code                                  | Runs in                               |
| ------------------------------------- | ------------------------------------- |
| Astro config, integrations            | Node                                  |
| Prerendered pages (dev + build)       | Node (`prerenderEnvironment: 'node'`) |
| On-demand routes (dev, preview, prod) | workerd                               |

Prerendered pages need Node because they read posts with `node:fs`. Code reachable from `posts/[slug]/[sha].astro` must run in workerd: no filesystem, no async work at module scope.

## Deployment Pipeline

1. `pnpm run build` runs `astro build`. The Cloudflare adapter produces:
   - `dist/client/` — prerendered HTML + assets (served by the CF `assets` binding)
   - `dist/server/` — Worker modules (`entry.mjs`, `chunks/`) and the generated `wrangler.json`
2. `wrangler.jsonc` holds the project settings (name, compatibility date/flags, custom domains). `astro build` merges it into `dist/server/wrangler.json` and writes `.wrangler/deploy/config.json`, which redirects `wrangler deploy` to the generated config.
3. `wrangler deploy` uploads the Worker modules plus `dist/client/`. Requests that match a static asset never reach the Worker; everything else does.

## Key Patterns

- Preact islands use `client:load`
- Post versioning: manifest at build time + Cloudflare Cache API at runtime
- Versioning needs `GITHUB_TOKEN` (set via wrangler secret in prod, `.env` locally)
- Syntax highlighting uses Shiki's JavaScript regex engine (`processor.ts`). The default Oniguruma engine decodes its WASM at module scope, which workerd rejects, so it cannot be used on the SSR route.
- TailwindCSS v4 via `@tailwindcss/vite` + `@import "tailwindcss"` in CSS (no config file)
- Code style enforced by Prettier: no semicolons, single quotes, trailing commas, 80 char line width. `posts/` is excluded (`.prettierignore`) so formatting never rewrites published content.
- `prettier-plugin-astro` stays on 0.14.x: 1.x reflows text inside inline elements (`<a>Atom</a>` becomes multi-line), which adds rendered whitespace under `compressHTML: true`. Revisit both settings together.
- `compressHTML: true` keeps the Astro 6 whitespace handling; the Astro 7 default (`'jsx'`) strips spaces between adjacent inline elements.
- `session: false` and `imageService: 'passthrough'`: the site uses neither sessions nor `astro:assets`, so no KV namespace or Images binding is provisioned on deploy.

## Development Notes

- Use `export const prerender = false` for SSR pages
- `GITHUB_TOKEN` is read directly from `process.env` (via `node:process`), not through `astro:env`: the same library code runs in the `posts-manifest` integration (Node, outside Vite, where `astro:env` virtual modules do not exist) and in workerd (where `nodejs_compat` populates `process.env` from Worker secrets). Set it via `wrangler secret put GITHUB_TOKEN` in prod, or `.env` locally — the integration hoists it for the Node side, the Cloudflare Vite plugin exposes it to workerd.
- Playwright browsers install via `pnpm exec playwright install` (browser cache lives in `~/Library/Caches/ms-playwright`).
- Playwright starts `pnpm run dev` on port 4321 and reuses any server already listening there outside CI; make sure no other project occupies that port before running e2e locally.
- Under a coding agent, Astro detects the agentic environment and runs `astro dev` / `astro preview` as background processes that return immediately. Playwright's `webServer` then reports "exited early": start the server first (`pnpm run dev`), run the tests (the running server is reused), then stop it with `pnpm exec astro dev stop` (`astro preview stop` for preview).
