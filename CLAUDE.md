# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website for nrako built with **Astro v6**, Preact, and TailwindCSS v4. Features a blog system using MyST markdown. Runs on Deno (no npm CLI required) and deploys to Cloudflare Workers.

## Toolchain

- **Runtime / package manager**: Deno >= 2.7 (owns `node_modules/` via `nodeModulesDir: "auto"`)
- **Formatter**: `deno fmt` (replaces Prettier)
- **Linter**: `deno lint` (replaces ESLint)
- **Builder**: Astro v6 via `npm:astro` invoked through Deno
- **Adapter**: `@deno/astro-adapter` with `start: false` — emits a `handle()` function the Worker mounts
- **Deploy**: `npm:wrangler deploy` (Cloudflare Workers)

Do not run `npm install`. Always use `deno install --allow-scripts` to populate `node_modules/` (Deno's symlink layout is incompatible with subsequent npm installs).

## Commands

```bash
deno install --allow-scripts  # First-time setup
deno task dev                 # Astro dev server (localhost:4321)
deno task build               # Production build → dist/{client,server}
deno task preview             # wrangler dev against the built worker
deno task serve               # Pure-Deno preview (Deno.serve + handle())
deno task check               # Astro type check
deno task lint                # deno lint
deno task format              # deno fmt
deno task test:e2e            # Playwright e2e
deno task deploy              # Build + wrangler deploy
```

## Architecture

**Astro v6** with `output: 'static'`, server-rendering opt-in via `prerender: false` on individual pages.

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

## Deployment Pipeline

1. `deno task build` runs Astro v6 via Deno. The `@deno/astro-adapter` produces:
   - `dist/client/` — prerendered HTML + assets (served by CF `assets` binding)
   - `dist/server/entry.mjs` — exports `handle(request)` for SSR routes
2. `worker.ts` is the Cloudflare Worker entry: it installs a minimal `globalThis.Deno` shim (only `env.get` is referenced by the adapter), then forwards `fetch` requests to `handle()`. The CF `assets` binding is checked first per `not_found_handling: "single-page-application"`; only SSR routes reach the Worker.
3. `wrangler deploy` uploads `worker.ts` (esbuild-bundled with `nodejs_compat`) plus `dist/client/`.

## Key Patterns

- Preact islands use `client:load`
- Post versioning: manifest at build time + Cloudflare Cache API at runtime
- Versioning needs `GITHUB_TOKEN` (set via wrangler secret in prod, `.env` locally)
- TailwindCSS v4 via `@tailwindcss/postcss` + `@import "tailwindcss"` in CSS (no config file)
- Code style enforced by `deno fmt`: no semicolons, single quotes, 80 char line width

## Development Notes

- Use `export const prerender = false` for SSR pages
- `GITHUB_TOKEN` is read directly from `process.env` (via `node:process`) — we deliberately don't declare it via `env.schema` / `astro:env`. `@deno/astro-adapter` doesn't yet implement Astro's `getSecret` feature, and declaring the schema would emit a misleading config error at every build/check. Set it via `wrangler secret put GITHUB_TOKEN` in prod, or `.env` locally (loaded by the `posts-manifest` integration).
- Deno's strict resolver requires every bare import in `src/` to appear in `package.json` `dependencies`/`devDependencies` (transitive npm deps are resolved automatically; direct imports in our own source are not).
- `deno task check` runs `scripts/deno-check.mjs`, which calls `@astrojs/check`'s `check()` API directly. Going through the Astro CLI (`deno run -A npm:astro check`) under Deno exits 0 silently — diagnostics never print and TS errors are not reported (verified by injecting `const _err: number = 'not a number'`). Calling the package API directly works correctly and propagates exit codes.
- `deno task test:e2e` sets `PW_DISABLE_TS_ESM=1`. Playwright's `loadConfig` calls `require("node:module").register` to wire up its TS-ESM loader; that API isn't implemented in Deno's Node compat layer, so Playwright misreads it as "Node <18.19" and refuses to load. With the env var set, Playwright skips that loader and Deno's own TS handling loads `playwright.config.ts` fine. Browsers install via `PW_DISABLE_TS_ESM=1 deno run -A npm:playwright install chromium` (browser cache lives in `~/Library/Caches/ms-playwright`, shared with any Node-installed Playwright).
