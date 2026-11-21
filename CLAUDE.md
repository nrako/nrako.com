# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website for nrako built with **Astro v7**, Preact, and TailwindCSS v4. Features a blog system using MyST markdown. Builds on Node.js with pnpm and deploys to Cloudflare Workers.

## Toolchain

- **Tool versions**: `mise.toml` pins Node.js and pnpm for local development and CI (`jdx/mise-action`). Change versions there only.
- **Runtime**: Node.js 26 (LTS)
- **Package manager**: pnpm 11 (`pnpm-lock.yaml` is committed)
- **Formatter**: Prettier + `prettier-plugin-astro` (config in `package.json`)
- **Linter**: ESLint flat config (`eslint.config.js`): `@eslint/js`, `typescript-eslint`, `eslint-plugin-astro`
- **Builder**: Astro v7 (Vite 8)
- **Adapter**: `@astrojs/cloudflare` — generates the deploy configuration, and the Worker entry (`@astrojs/cloudflare/entrypoints/server`) when a route is rendered on demand
- **Deploy**: `wrangler deploy` (Cloudflare Workers)

Use pnpm for every dependency change. Do not use `npm install`.

### Security model

Supply-chain trust is anchored at install time:

- **No dependency lifecycle scripts.** pnpm only runs install scripts allowed in `pnpm-workspace.yaml` (`allowBuilds`). `esbuild` and `workerd` are explicitly denied there; their native binaries ship as prebuilt optional dependencies, so the scripts are not needed. To allow an audited script, set its entry to `true`.
- **`pnpm-lock.yaml` integrity hashes.** CI installs with `--frozen-lockfile`; a tampered tarball is rejected.

There is no runtime sandbox: `dev` / `build` / `preview` / `test:e2e` / `deploy` run dependency code with the invoking user's full permissions. Treat the pinned dependency tree as trusted code and review lockfile changes accordingly.

When a route is rendered on demand, `astro build` copies local `.env` values into `dist/server/.dev.vars` so `astro preview` can use them. `dist/` is gitignored and `wrangler deploy` uploads only the Worker modules and `dist/client/`; never publish `dist/server/` by other means.

## Commands

```bash
mise install                  # Node.js + pnpm at the versions in mise.toml
pnpm install                  # First-time setup (no install scripts run)
pnpm run dev                  # Astro dev server (localhost:4321)
pnpm run build                # Production build → dist/{client,server}
pnpm run preview              # Preview the production build locally in workerd
pnpm run check                # Astro type check
pnpm run lint                 # ESLint
pnpm run format               # Prettier (write)
pnpm run format:check         # Prettier (check)
pnpm run test:e2e             # Build, then Playwright e2e against the preview
pnpm run test:e2e:fixtures    # Same, with the site built from tests/fixtures/posts
pnpm run deploy               # Build + wrangler deploy
```

## Architecture

**Astro v7** with `output: 'static'`. Every page is prerendered; server rendering is opt-in via `prerender: false` on individual pages and none uses it today.

**Pages** (`src/pages/`):

- `index.astro` — Homepage (static): the site name, one sentence about the author with its animated introduction, and the post listing
- `posts/index.astro` — Post listing (static), linked as "Posts" in the header. It lists the same posts as the homepage and says so when nothing is published
- `posts/[slug].astro` — Single post (static, prerendered)
- `posts/[slug]/[sha].astro` — Post at an older commit (static, one page per version)
- `404.astro` — Not-found page (static)
- `feed/[type].ts` — RSS/Atom/JSON feed endpoints (static)

**Layouts** (`src/layouts/`): `Layout.astro` (root, with header/footer/theme toggle). Its header links "Posts" to `/posts` and "About" to `/#about` on every page. The latter is `components/AboutLink.astro`: named "About Me" for assistive technology, it adds "Me", "Myself", "I" in turn under a mouse or keyboard focus, and reads "About..." while the homepage animation plays (`data-about-playing` on `<html>`, set by the island).

**Preact Islands** (`src/components/preact/`, mounted with `client:load`):

- `theme-toggle.tsx`
- `about-animation/` — the introduction on the homepage. It shows one sentence and plays the animated sequence only when a link to `#about` is followed on the homepage, or when the homepage is reached with that anchor, which is what the "About" link does from other pages. `script.ts` is the sequence of scenes and its timing, `views.tsx` renders a scene, `about-animation.css` holds the transitions. `?speed=2` plays it twice as fast and `?from=<chapter>` starts it at a chapter (`CHAPTERS` in `script.ts`), both for tuning
- Bluesky: `bluesky-interactions.tsx`, `author.tsx`, `reply.tsx`, `avatar.tsx`, `post-embed.tsx`, `reaction-bar.tsx`

**Blog System** (`src/lib/`):

- `blogData.ts` — Post loading, reading time
- `processor.ts` — MyST markdown processing with Shiki syntax highlighting
- `githubVersioning.ts` — Post version history and old versions from the GitHub API
- `bluesky.ts` — Bluesky API integration

**Integrations** (`src/integrations/`): `server-env.ts` — copies `GITHUB_TOKEN` from `.env` onto `process.env` for the prerendered pages.

**Workers** (`workers/`): `www-redirect/` — standalone Worker bound to `www.nrako.com` that redirects to `nrako.com` with a 301. It has its own `wrangler.jsonc` and is not part of the Astro build.

**Content**: Blog posts in `posts/*.md` (MyST markdown + frontmatter). Nothing is published at the moment, so the directory does not exist; create it with the first post. The post pages and version pages only exist once a post does.

## Runtime environments

| Code                                  | Runs in                               |
| ------------------------------------- | ------------------------------------- |
| Astro config, integrations            | Node                                  |
| Prerendered pages (dev + build)       | Node (`prerenderEnvironment: 'node'`) |
| On-demand routes (dev, preview, prod) | workerd                               |

Prerendered pages need Node because they read posts with `node:fs`. There is no on-demand route today. Code reachable from one would have to run in workerd: no filesystem, no async work at module scope, and 10 ms of CPU per request on the Workers Free plan.

## Deployment Pipeline

1. `pnpm run build` runs `astro build`. The Cloudflare adapter produces:
   - `dist/client/` — prerendered HTML + assets, plus the generated `wrangler.json`
   - `dist/server/` — Worker modules, only when a route is rendered on demand (empty today)
2. `wrangler.jsonc` holds the project settings (name, compatibility date/flags, custom domains). `astro build` merges it into the generated `wrangler.json` and writes `.wrangler/deploy/config.json`, which redirects `wrangler deploy` to the generated config.
3. `wrangler deploy` uploads `dist/client/`. With every page prerendered the deployment is assets-only: no Worker code runs, and a request that matches no asset gets `404.html` (`not_found_handling: "404-page"`). With an on-demand route, the adapter also uploads a Worker, which receives the requests that match no asset.
4. `pnpm run deploy` then deploys the `www-redirect` Worker (`wrangler deploy --config workers/www-redirect/wrangler.jsonc`). The site only owns the `nrako.com` custom domain; `www.nrako.com` belongs to that Worker.

## Key Patterns

- Preact islands use `client:load`
- Post versioning: the commit history and every older version are fetched from the GitHub API at build time and prerendered. A new commit to a post shows up after the next build and deploy.
- Versioning needs `GITHUB_TOKEN` at build time (`.env` locally, `secrets.GITHUB_TOKEN` in CI). Without it the build succeeds with no version history and no version pages. A listed version that cannot be fetched fails the build.
- The latest version's page (`/posts/<slug>/<latest sha>`) is a meta-refresh redirect to the post; the version list links the latest entry to the post directly.
- Syntax highlighting uses Shiki's JavaScript regex engine (`processor.ts`). The default Oniguruma engine decodes its WASM at module scope, which workerd rejects; the JavaScript engine keeps the pipeline usable from an on-demand route.
- Feed `Content-Type` headers live in `public/_headers`: the feeds are prerendered to extensionless files, so the type set in `src/pages/feed/[type].ts` only applies in dev. Keep both in sync.
- `public/robots.txt` allows search engines, opts out of AI training and AI answers (Content Signals), and turns away a fixed list of AI training and SEO crawlers. It only states preferences; blocking is done in the Cloudflare dashboard (Security > Settings > Bot traffic), which is not versioned here. If Cloudflare's Bot Preference Sync is enabled, its managed directives are prepended to this file at the edge.
- Host-level redirects cannot go in `public/_redirects` (Cloudflare does not support domain-level rules there), hence the separate `www-redirect` Worker.
- One column for the whole site: `--column` (`global.css`) is the measure of a post, and the header, the footer and every page's content use it (`max-w-(--column)`), so the width does not change from one page to the next. Prose pages need the class too: it overrides the typography plugin's own `65ch`, which depends on each page's font size.
- What the header draws sits between the baseline of its text links and the top of their capitals: every icon is as tall as a capital and centred on them. The icons are inline and their lower margin does the centring (`.site-header` in `global.css`). The home plate is centred on the column's left edge, which its tip points at; `--plate` is its height in capitals. The capital height is a constant of the typeface (`--type-cap`).
- Typography: Fustat for the text, Source Sans 3 for the headings and the name, Source Code Pro for code, self-hosted through @fontsource (OFL). One scale of sizes (`--size-*` in `global.css`) for every page, with one factor per face so that both have the same x-height. `.post-entry` is a post in a listing, and the prose pages take the same sizes in place of the typography plugin's. `Layout.astro` preloads the Latin files of Fustat and Source Sans 3, used on every page; `Fustat Fallback` and `Source Sans 3 Fallback` are Arial set to their metrics, so the text does not reflow when the fonts arrive. Changing a face means measuring its capital height (`--type-cap`, which the header aligns on), its x-height and its fallback metrics again.
- TailwindCSS v4 via `@tailwindcss/vite` + `@import "tailwindcss"` in CSS (no config file)
- Code style enforced by Prettier: no semicolons, single quotes, trailing commas, 80 char line width. `posts/` is excluded (`.prettierignore`) so formatting never rewrites published content.
- `prettier-plugin-astro` stays on 0.14.x: 1.x reflows text inside inline elements (`<a>Atom</a>` becomes multi-line), which adds rendered whitespace under `compressHTML: true`. Revisit both settings together.
- `compressHTML: true` keeps the Astro 6 whitespace handling; the Astro 7 default (`'jsx'`) strips spaces between adjacent inline elements.
- `session: false` and `imageService: 'passthrough'`: the site uses neither sessions nor `astro:assets`, so no KV namespace or Images binding is provisioned on deploy.

## Development Notes

- Use `export const prerender = false` for SSR pages. The first one turns the deployment from assets-only into assets plus a Worker.
- `GITHUB_TOKEN` is read directly from `process.env` (via `node:process`). Vite only exposes `VITE_*` variables through `import.meta.env`, so the `server-env` integration hoists the token from `.env`. It is not needed at runtime: the deployed site has no Worker secret.
- Playwright browsers install via `pnpm exec playwright install` (browser cache lives in `~/Library/Caches/ms-playwright`).
- `pnpm run test:e2e` builds the site and runs Playwright against `astro preview` on port 4390 (override with `E2E_PORT`), on chromium, firefox, webkit and mobile-chrome. It always starts its own server and fails if the port is taken. The tests target the production build, not the dev server: the dev server compiles pages and browser scripts on demand, which made first loads time out at random.
- `POSTS_DIR` overrides the directory the posts are read from. `pnpm run test:e2e:fixtures` sets it to `tests/fixtures/posts`, which is how the post tests run while nothing is published. `pnpm run test:e2e` builds from `posts/` and skips the tests that need a post or a fixture. Run both. Version history is always looked up under `posts/` on GitHub, so fixture posts have none.
- `samples/posts/` holds realistic sample posts for design work. They are never published: `POSTS_DIR=samples/posts pnpm run dev` serves the site with them.
- Under a coding agent, Astro detects the agentic environment and runs `astro dev` / `astro preview` as background processes that return immediately (stop them with `pnpm exec astro dev stop` / `astro preview stop`). Pass `--ignore-lock` to keep the server in the foreground, as the Playwright config does.
