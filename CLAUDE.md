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

Do not run `npm install`. Always use `deno install` to populate `node_modules/` (Deno's symlink layout is incompatible with subsequent npm installs).

### Security model

The honest threat model for a Deno + npm build, in order of value:

**The controls that actually matter (install-time, before any dep code runs):**

- **`deno install` runs WITHOUT `--allow-scripts`.** No npm postinstall script executes. This is the single highest-value control — postinstall is the real supply-chain propagation vector (it's how the Shai-Hulud worm spread), and it runs before the lockfile is even consulted. Native binaries we need (sharp, workerd, fsevents) ship as separate prebuilt-binary deps, so postinstall was never required. To re-enable an audited script: `deno install --allow-scripts=npm:foo`.
- **`deno.lock` integrity hashes.** Deno verifies every npm tarball against the locked hash on each install; a tampered package is rejected automatically. Free, automatic.

**The build-time ceiling (be honest about this):** `dev` / `build` / `preview` / `deploy` / `test:e2e` all grant `--allow-ffi` (and `--allow-run`) because rollup/esbuild/sharp/workerd load native `.node` binaries. **Once `--allow-ffi` is granted, Deno's other permission scoping is bypassable** — a malicious dep can `dlopen` libc and call `getenv()` / `open()` directly, sidestepping `--allow-env` / `--allow-read`. Verified: an FFI call reads an env var that `--deny-env` "blocks". So on FFI tasks we are trusting the pinned dependency tree, full stop. That trust is anchored at install time (no postinstall + lockfile), not at runtime flags.

**What the runtime flags still buy (defense-in-depth, low cost):**

- `--allow-read` / `--allow-write` scoped to `.,$TMPDIR,$HOME/Library/Caches/deno,$HOME/Library/Preferences/astro` — blocks a _lazy / untargeted_ dependency that naively reads `~/.ssh` via `node:fs`. A targeted attacker uses FFI and walks around it; mass-compromise malware often doesn't bother, so this has some real-world value at near-zero maintenance cost.
- `--allow-env` is **open** (no deny-list). We deliberately dropped `--deny-env`: it's defeated by FFI anyway (proven), and maintaining a secret-name blocklist was high-effort for false confidence.
- `--allow-net` is open. Host allowlisting is too brittle for npm/GitHub/CF tooling.
- `--no-prompt` so a permission failure terminates instead of prompting. Without it, Vite's lockfile/workspace FS walks trigger a cascade of "Allow?" prompts that train you to press `A`. With it, tools that catch stat errors (Vite does) treat denied paths as "absent" and continue; others abort cleanly.

**`serve` is the one genuinely-sandboxed task:** it runs the built SSR bundle (pure JS — no native deps), so it gets only `--allow-read=./dist --allow-net --allow-env`, no FFI/run. Here the scoping is a real boundary, not theater.

**Filesystem-walk workarounds** (only needed because read access is scoped):

- `pnpm-workspace.yaml` (empty) stops Vite's `searchForWorkspaceRoot` walking up past the project root.
- `pnpm-lock.yaml` (empty) stops Vite's `getLockfileHash` `lookupFile()` walk (it otherwise walks to `/` looking for `package-lock.json`, `yarn.lock`, `bun.lockb`, `.rush/temp/shrinkwrap-deps.json`, …). Also gives Vite a stable dep-cache hash input.
- `BROWSERSLIST_ROOT_PATH=$PWD` (inline per task) stops browserslist's own ancestor walk.

Neither marker file is used at runtime — they're signposts. We don't use pnpm.

## Commands

```bash
deno install                  # First-time setup (NO --allow-scripts; see Security)
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
- `deno task test:e2e` sets `PW_DISABLE_TS_ESM=1`. Playwright's `loadConfig` calls `require("node:module").register` to wire up its TS-ESM loader; that API isn't implemented in Deno's Node compat layer, so Playwright misreads it as "Node <18.19" and refuses to load. With the env var set, Playwright skips that loader and Deno's own TS handling loads `playwright.config.ts` fine. Browsers install via `PW_DISABLE_TS_ESM=1 deno run --allow-read --allow-write --allow-env --allow-net --allow-run --allow-sys --allow-ffi npm:playwright install` (browser cache lives in `~/Library/Caches/ms-playwright`, shared with any Node-installed Playwright).
