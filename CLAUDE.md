# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website for nrako built with Astro v5, Preact, and TailwindCSS v4. Features a blog system using MyST markdown. Deployed to Cloudflare.

## Commands

```bash
npm run dev        # Start dev server (localhost:4321)
npm run build      # Production build
npm run preview    # Preview production build locally
npx astro check    # Type checking
```

## Architecture

**Astro v5**: Static site generation with SSR opt-in for versioned posts.

**Pages** (`src/pages/`):

- `index.astro` - Homepage
- `posts/index.astro` - Blog listing
- `posts/[slug].astro` - Single post (static, prerendered)
- `posts/[slug]/[sha].astro` - Versioned post (SSR)
- `feed/[type].ts` - RSS/Atom/JSON feed endpoints

**Layouts** (`src/layouts/`):

- `Layout.astro` - Root layout with header, footer, theme toggle

**Preact Islands** (`src/components/preact/`) - Client-side interactive components:

- `hero-text.tsx` - Animated text on homepage
- `bluesky-interactions.tsx` - Bluesky comment integration
- `theme-toggle.tsx` - Dark/light mode toggle
- `vim-replace-text.tsx` - Vim-style text animation
- `author.tsx` - Author popover with links
- `reply.tsx`, `avatar.tsx`, `post-embed.tsx`, `reaction-bar.tsx` - Bluesky components

**Astro Components** (`src/components/`) - Static server-rendered components:

- `Time.astro`, `ReadTime.astro`, `PostCard.astro`, `Authors.astro`, `PostVersions.astro`

**Blog System** (`src/lib/`):

- `blogData.ts` - Post loading, caching, reading time calculation
- `processor.ts` - MyST markdown processing with Shiki syntax highlighting
- `githubVersioning.ts` - Post version history from GitHub commits
- `bluesky.ts` - Bluesky API integration

**Content**: Blog posts in `posts/` as MyST markdown files with frontmatter

## Key Patterns

- Preact islands use `client:load` directive
- Post versioning uses manifest (generated at build) + Cloudflare Cache API (SSR)
- Post versioning pulls commit history via GitHub API (requires GITHUB_TOKEN)
- TailwindCSS v4 via @tailwindcss/postcss (no config file needed)
- Formatting: no semicolons, single quotes, 80 char line width

## Development Notes

- Dev server runs on localhost:4321
- Deployed to Cloudflare Workers
- CI runs type checking and builds before deploy
- Use `export const prerender = false` for SSR pages
