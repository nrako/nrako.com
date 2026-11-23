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
pnpm run test:unit            # Unit tests of the post markup (node:test)
pnpm run test:e2e             # Build, then Playwright e2e against the preview
pnpm run test:e2e:fixtures    # Same, with the site built from tests/fixtures/posts
pnpm run deploy               # Build + wrangler deploy
```

## Architecture

**Astro v7** with `output: 'static'`. Every page is prerendered; server rendering is opt-in via `prerender: false` on individual pages and none uses it today.

**Pages** (`src/pages/`):

- `index.astro` — Homepage (static): the site name, one sentence about the author with its animated introduction, and the listing of the listed posts
- `posts/index.astro` — Post listing (static), linked as "Posts" in the header. It lists the same posts as the homepage and says so when nothing is listed
- `posts/[slug].astro` — Single post (static, prerendered)
- `posts/[slug]/[sha].astro` — Post at one of its commits, the latest included: its permalink (static, one page per version)
- `posts/[slug]/snippets/[label].astro` — A snippet's demo alone (static, one page per snippet that has a label)
- `404.astro` — Not-found page (static)
- `feed/[type].ts` — RSS/Atom/JSON feed endpoints (static), of the listed posts

**Layouts** (`src/layouts/`): `Layout.astro` (root, with header/footer/theme toggle). The header and the footer are `components/SiteHeader.astro` and `components/SiteFooter.astro`; a page that passes `bare` gets neither, only the head (fonts, theme, reading settings) and its own content. Its header links "Posts" to `/posts` and "About" to `/#about` on every page. The latter is `components/AboutLink.astro`: named "About Me" for assistive technology, it adds "Me", "Myself", "I" in turn under a mouse or keyboard focus, and reads "About..." while the homepage animation plays (`data-about-playing` on `<html>`, set by the island).

**Preact Islands** (`src/components/preact/`, mounted with `client:load`):

- `theme-toggle.tsx`
- `reading-settings.tsx` — the "Tt" button in the header and its popover: the typeface of a post's text (Sans, Serif, Hyperlegible), the size of the text and its weight (three steps each), and the background (Contrast, Soft). `src/lib/reading.ts` holds the choices; each is an attribute on `<html>` (`data-reading-font`, `data-reading-size`, `data-reading-weight`, `data-reading-background`), absent for the default, kept in `localStorage` and set by an inline script in `Layout.astro` before render
- `about-animation/` — the introduction on the homepage. It shows one sentence and plays the animated sequence only when a link to `#about` is followed on the homepage, or when the homepage is reached with that anchor, which is what the "About" link does from other pages. Before the first scene, the sentence leaves as noise while the room for the stage opens (`playOpening`); with reduced motion, or when the sequence is asked for again while it plays, the stage comes at once. The noise is `src/lib/noise.ts`, shared with the header's "About" link. `script.ts` is the sequence of scenes and its timing, `views.tsx` renders a scene, `about-animation.css` holds the transitions. `?speed=2` plays it twice as fast and `?from=<chapter>` starts it at a chapter (`CHAPTERS` in `script.ts`), both for tuning
- `author.tsx` — a post's author from its frontmatter, with a popover of their details
- Bluesky: `bluesky-interactions.tsx`, `bsky-author.tsx`, `reply.tsx`, `avatar.tsx`, `post-embed.tsx`, `reaction-bar.tsx`, `reaction-count.tsx`

**Blog System** (`src/lib/`):

- `blogData.ts` — Post loading (`getPosts` for the pages, `getListedPosts` for the listings and the feeds), reading time
- `processor.ts` — MyST markdown processing with Shiki syntax highlighting
- `citations.ts` — Citations of a post's BibTeX bibliography and its list of references
- `crossReferences.ts` — What MyST's resolved references still need from the HTML renderer
- `tableOfContents.ts` — A post's sections, read from the headings of its HTML
- `snippets.ts` — The `{snippet}` directive: HTML, CSS and JavaScript shown in a post as a live demo and as source
- `snippetDemo.ts` — How a demo is made from its sources, for the server and for the browser
- `snippetEditor.ts` — Browser script of a snippet's page: its sources as fields, the demo drawn again as they change
- `snippetHighlight.ts` — The highlighter of those fields, fetched apart by the editor
- `codeThemes.ts` — The themes code is highlighted in, for the server and for the browser
- `githubVersioning.ts` — Post version history and old versions from the GitHub API
- `permalinks.ts` — The addresses of a post and of its versions, and the links its pages declare about themselves
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
- Unlisted posts: `listed: false` in a post's frontmatter keeps it out of the homepage, `/posts` and the feeds, and nothing else: its page, the pages of its snippets and its version pages are built as any post's, so it is reached by its address or by a link. The rule is `getListedPosts` (`blogData.ts`) and only there: a page that lists posts calls it, one that builds pages calls `getPosts`. With every post unlisted, the listings read as with no post. `listed` is the site's own key: `processor.ts` takes it out of the frontmatter before MyST's validation, which would drop it with a warning. A value that is neither `true` nor `false` fails the build.
- Post versioning: the commit history and every older version are fetched from the GitHub API at build time and prerendered. A new commit to a post shows up after the next build and deploy.
- Versioning needs `GITHUB_TOKEN` at build time (`.env` locally, `secrets.GITHUB_TOKEN` in CI). Without it the build succeeds with no version history and no version pages. A listed version that cannot be fetched fails the build.
- Every committed version has its page, the latest one included, never a redirect: a text fragment (`#:~:text=`) does not survive one. The version list links each entry to its page. The page says which version it is and, for the latest, that it is the latest. A `draft` entry, when the post's file differs from its last commit, has no page.
- A post's pages declare their links in the head (`postLinks` in `permalinks.ts`, `components/PostLinks.astro`), as absolute URLs on `site` (`astro.config.ts`): `rel="canonical"` (RFC 6596) is the post's page, on itself and on each version; `rel="cite-as"` (RFC 8574) is the permalink of the version the page shows: itself on a version, the latest on the post's page. The post's page cites no version when it has no history or shows a draft. A version is `noindex`: searches lead to the post. The snippet pages and the feeds declare none of this.
- Citations: a post lists BibTeX files under `bibliography` in its frontmatter, as paths from the posts directory, and cites their works by key: `@key`, `[@key, p. 3; @other]`, `[-@key]` or the `{cite}` roles (`citations.ts`). Each citation links to its entry in the "References" section, which lists the cited works in the APA style, sorted by name, after the footnotes; a `{bibliography}` directive places the list elsewhere. `citation-js-utils`, from the MyST project, parses and formats.
- An @ only cites in a post that lists a bibliography; elsewhere it is text, which costs the post a second parse (`processor.ts`). A key the bibliography does not hold stays in the text as `@key` with a warning, shown in dev like the frontmatter's. A bibliography that is missing, outside the posts directory or not BibTeX fails the build.
- An older version of a post reads its bibliography from GitHub at the same commit. A commit that only changes the `.bib` file adds no version to the post.
- References between the parts of a post are resolved by MyST's own transforms (`enumerateTargetsPlugin` and `resolveReferencesPlugin`, in `processor.ts`): they number the figures, tables, equations and labelled code, and name a reference that has no text. The renderer of `myst-to-html` is run without the transforms `mystToHtml` puts before it, which would number, title and resolve everything a second time. `crossReferences.ts` finishes what that renderer leaves out: the `id` of a labelled block or equation, the number before a caption, and a text for an empty link or for a reference whose target does not exist. What MyST reports on the way, such as that missing target, joins the post's messages, shown in dev.
- Table of contents: a post with two sections or more lists them (`tableOfContents.ts`, `components/TableOfContents.astro`, `.post-contents` in `global.css`): its `h2` and `h3` that have an `id`, the references included, the label of the footnotes and the headings of a snippet's demo left out. It is one list, the last element of `.post-body`, which holds the post's text and its reactions. In a window of 80rem or more it stands in the margin beside the text and follows the reader down it (a rail as tall as the text, the list `sticky` in it). In a narrower one it is a bar at the foot of the window (`sticky` at the bottom, so it stops where `.post-body` ends, under the reactions), which names the section being read and opens the list over itself; a section chosen, a press outside or Escape closes it. The list is a `<details>`: in the margin CSS shows it closed or not (`::details-content`), and a browser without that keeps the bar to open it. The list starts with the post's title, which leads to the top of the page (an icon says so once the title is no longer the entry being read), and a post with a `bskyUri` ends it with a link to its reactions (`#reactions`, set in `pages/posts/[slug].astro`); a rule sets each apart from the sections. The component's script marks the section being read (`aria-current="location"`): the one whose heading is in the upper third of the window (the first if several are, so that a short section just chosen is the one marked), else the one whose heading was last passed, the title before the first section, or the last of the list at the foot of the page. Without the script the list still leads to every section.
- Safe areas: the viewport is `viewport-fit=cover`, so the page reaches the edges of a phone's screen. `body` pads itself by the insets at either side, and the bar of the table of contents by the one at the bottom. Anything else set against an edge of the window has to do the same.
- Snippets: `:::{snippet} A caption` holds the `html` or `svg` of a demo, the `css` blocks that style it and the `js` blocks that run in it (`snippets.ts`, a MyST directive passed to the parser). The post shows the demo, then each source under the name of its language (as tabs, read by CSS alone from a group of radio buttons, once the sources run to 24 lines; in a post a source taller than 28rem scrolls, on the snippet's page it runs in full), under a caption numbered "Example 1" that a label makes referable, as a figure's. The demo is set in the page itself and never in a frame: its text has to be the post's, which a reader selects, searches and links to (a text fragment cannot reach into a frame). Its CSS is wrapped in an `@scope` block whose root is the demo, so it styles nothing else; a browser without `@scope` shows the demo unstyled. The reverse is not kept out: a class of the site that the demo also uses styles the demo. Its script is a module script set after the demo's HTML, wherever the demo is: what it declares is its own, but it sees the whole page, so it finds its elements by an `id` or a class nothing else on the page has. A snippet without `html` or `svg` is an error, unless it is a script with a console (below); any other language is shown and not run, with a warning. An `svg` block is highlighted as XML.
- A `console` block gives a snippet a console, set after its sources and under their tabs: in a post it is text, what the post says the script writes, written by hand and never run against the script. On the snippet's page the console starts empty and takes what the script does write (`console.log`, `info`, `warn`, `error`, `debug`, patched by an inline script of the page, which is alone there to write), under the demo and, with `?source`, as the foot of the bench under all the panes, emptied each time the demo is drawn again. The block is not a source: it has no pane and is not sent to LiveCodes, whose own console opens instead (`tools` in the playground's config). A script alone is a snippet when it has a console: its demo is set `hidden`, there to run the script.
- A snippet that has a label also has a page of its own under its post, `/posts/<slug>/snippets/<label>` (`pages/posts/[slug]/snippets/[label].astro`), which the caption of its figure links to with two icons, one to the demo alone and one to its sources: a snippet is written in a post and belongs to it. The page is `bare` and holds the demo and nothing else that reads as text: what a browser does with a page's text can depend on what else the page says. Its links are icons for that reason. With `?source` the page is a bench instead: it takes the width of the window (up to 120 characters a line in each pane, which only a snippet of one source stops short of), the demo on top and each source in a field under it, side by side while there is room and down to the foot of the window, and the demo is drawn again as they are edited (`lib/snippetEditor.ts`, a plain script, not an island). The demo is built in the browser by the rule the server follows, kept in `lib/snippetDemo.ts` for both. A script that does not parse leaves the demo with the script as it last parsed, so a line being typed does not kill it, and a script that fails, then or as it runs, is marked on its pane with the reason as title; no more of an error is shown. Nothing is saved: loading the page again gives the snippet as written, and is the way to be rid of what an edited script left running. To keep an edit, an icon, which says "Continue in LiveCodes" once a source is edited, leads to a LiveCodes playground (open source, run in the browser) that opens with the sources as they stand: its SDK (`livecodes`) builds the address and puts them, compressed, in the fragment, which is not sent to their server. Nothing is asked of LiveCodes before the link is followed. The sources, which repeat the demo's words, wait in a `<template>`, whose content is not part of the document, until the address has `?source`: an inline script reads it, since the page is static. Not rendering them (`display: none`) would have left them in the document, which is not a claim to rest a demo about hidden text on. The page is `noindex`. A label only has to be unique within its post. There is no listing of snippets.
- The fields of a snippet's page are coloured as code is in a post: a field cannot colour its own text, so the editor draws it a second time, highlighted, in a `<pre>` over the field (`.snippet-highlight`, `aria-hidden`), whose own text is then transparent. The field keeps the caret, the selection and the keys; both are set alike to the letter (`global.css`), and the drawing is made again once a frame at most and moved as the field scrolls. The highlighter (`snippetHighlight.ts`) is Shiki with the posts' themes and only the grammars of a demo (HTML, CSS, JavaScript, XML for `svg`); a source in another language stays uncoloured. It weighs some 100 kB compressed, most of that page, so the editor imports it dynamically, once the page has loaded: it is only fetched with `?source`, the fields are edited before it arrives, and the page's load does not wait for it (WebKit holds the load for a module asked for before it). Its engine is told `target: 'ES2018'`: left to choose, it tokenises a script in WebKit otherwise than elsewhere. Shiki's time limit on a line is lifted (`tokenizeTimeLimit: 0`): a first pass slower than half a second left the rest of a line uncoloured. An e2e test compares a field's colours with its source's in the post, on every browser.
- Code is highlighted with `github-light-high-contrast` / `github-dark-high-contrast` (`codeThemes.ts`): every token reaches 7:1 on the code block in both themes and both reading backgrounds, the light comments through a `colorReplacements` entry. The block's background is tinted from `--ink` and `--ground` (`global.css`), not the theme's. Measure the tokens again when changing either.
- Syntax highlighting uses Shiki's JavaScript regex engine (`processor.ts`). The default Oniguruma engine decodes its WASM at module scope, which workerd rejects; the JavaScript engine keeps the pipeline usable from an on-demand route.
- No page is shown in a frame: `public/_headers` sends `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY` with every response. A snippet's page runs the code typed in its fields, which only its visitor can put there; framed by another site, the visitor could be led to drag text into them. There is no policy on scripts: the site has nothing injected to stop, a hash cannot cover code typed in the editor, and the editor's check of a script's syntax would need `'unsafe-eval'`. Revisit both if the origin ever holds something to take (a login, a cookie, a route rendered on demand): the edited demo would then belong in a sandboxed frame. The dev server does not send these headers; `astro preview` and the deployment do.
- Feed `Content-Type` headers live in `public/_headers`: the feeds are prerendered to extensionless files, so the type set in `src/pages/feed/[type].ts` only applies in dev. Keep both in sync.
- `public/robots.txt` allows search engines, opts out of AI training and AI answers (Content Signals), and turns away a fixed list of AI training and SEO crawlers. It only states preferences; blocking is done in the Cloudflare dashboard (Security > Settings > Bot traffic), which is not versioned here. If Cloudflare's Bot Preference Sync is enabled, its managed directives are prepended to this file at the edge.
- Host-level redirects cannot go in `public/_redirects` (Cloudflare does not support domain-level rules there), hence the separate `www-redirect` Worker.
- One column for the whole site: `--column` (`global.css`) is the measure of a post, and the header, the footer and every page's content use it (`max-w-(--column)`), so the width does not change from one page to the next. Prose pages need the class too: it overrides the typography plugin's own `65ch`, which depends on each page's font size.
- What the header draws sits between the baseline of its text links and the top of their capitals: every icon is as tall as a capital and centred on them. The icons are inline and their lower margin does the centring (`.site-header` in `global.css`). The home plate is centred on the column's left edge, which its tip points at; `--plate` is its height in capitals. The capital height is a constant of the typeface (`--type-cap`).
- Typography: Fustat for the text, Source Sans 3 for the headings and the name, Source Code Pro for code, self-hosted through @fontsource (OFL). One scale of sizes (`--size-*` in `global.css`) for every page, with one factor per face so that both have the same x-height. `.post-entry` is a post in a listing, and the prose pages take the same sizes in place of the typography plugin's. `Layout.astro` preloads the Latin files of Fustat and Source Sans 3, used on every page; `Fustat Fallback` and `Source Sans 3 Fallback` are Arial set to their metrics, so the text does not reflow when the fonts arrive. Changing a face means measuring its capital height (`--type-cap`, which the header aligns on), its x-height and its fallback metrics again.
- Weights: every weight is a `--weight-*` (`global.css`), its usual value plus `--weight-shift`, so the hierarchy moves as one; Tailwind's `font-*` utilities map to them. The shift is the theme's (`-25` in dark mode: light text on a dark ground looks heavier) plus the reader's weight setting (`-100` or `+150`). Write a new weight as one of these variables, never as a number. The introduction's scenes keep their own weights.
- Colours: the page is `--ink` on `--ground` (`global.css`), set per theme; popovers use `--surface`. The reader's background setting picks full contrast (white/black) or a softer pair (`#fbfaf7`/`#262626` light, `#1a1a1a`/`#d6d6d6` dark), each at least 7:1 and barely tinted: the screen sets its own warmth. Secondary text is `--muted`, and `--accent` (red) marks a hover, a focus or a link's target. Draw new text and rules in `currentColor` or these variables rather than black, white or a fixed colour. In prose, a link that stays on the page (a citation, a reference to a figure or a section, a note) is underlined with dots, one that leaves it with a line. An abbreviation is not a link and has no underline: it spells itself out under the pointer. A highlight (`<mark>`) is the ground tinted with the accent, its text still in the ink, at 9:1 or more on every ground.
- Reading settings (`global.css`): the size multiplies the column and every `--size-*` but `--size-name` by `--reading-scale`; the header keeps its own size. The typeface only changes `.prose` (`--type-reading`): Source Serif 4 or Atkinson Hyperlegible Next, each with a `--type-reading-scale` that gives it Fustat's x-height and an Arial fallback measured like the others. Their fonts are declared on every page and only fetched once chosen.
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
- `samples/posts/what-a-post-can-set.md` uses every piece of MyST markup the site renders, and lists what it does not render yet. Its figure is `public/samples/from-source-to-page.svg`: a post's images are served from `public/`, so this one file of the samples is deployed. `tests/unit/sample-markup.test.ts` holds it to that: add a piece to both when the site learns to render it.
- `samples/posts/snippets-at-work.md` holds the snippets a post is likely to need: text hidden in several ways, a layout, a drawing, a counter with its script and a function alone with its console. `tests/unit/samples.test.ts` renders every sample post.
- `pnpm run test:unit` runs `tests/unit/` with Node's own test runner, which reads the TypeScript sources directly. It covers what a post's markup becomes (`processor.ts`), including the failures a built page cannot show.
- Under a coding agent, Astro detects the agentic environment and runs `astro dev` / `astro preview` as background processes that return immediately (stop them with `pnpm exec astro dev stop` / `astro preview stop`). Pass `--ignore-lock` to keep the server in the foreground, as the Playwright config does.
