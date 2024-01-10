---
title: A "Fresh" start
description: First post
date: 2024-01-01 22:40:45 +0002
slug: fresh-start
---

> Ne faites pas de buit, ne parlez pas

I thought I'd start this new year, with a "Fresh" start. With a new post.

## How does my Fresh Blog Plugin Work?

| Type | Value |
| ---- | ----- |
| x    | 42    |
| y    | 66    |

```javascript
console.log("Hello, world!");
```

- [] TODO support additional syntax highlight by reading a new front matter `attrs.tags` or `attrs.highlights`
- [] TODO add a copy to clipboard functionality

```typescript
import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import blogPlugin from 'https://deno.land/x/fresh-blog-plugin/mod.ts'

export default defineConfig({
  plugins: [tailwind()], // [!code --]
  plugins: [tailwind(), blogPlugin()], // [!code ++]
});
```

It support TeX formatting:

$$ y = x^2 $$

Inline math: $y = x^2$

- [] TODO support TeX by reading a new front matter `attrs.highlight = ['TeX']` 

## It support YouTube Embed through iFrame:

<iframe class="w-full aspect-video"
src="https://www.youtube.com/embed/4boXExbbGCk" 
frameborder="0" 
allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
allowfullscreen></iframe>

Pro-tip: use `class="w-full aspect-video` instead of `width="560" height="315"`

## Embed Twitter (X)

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">WHAT<br> M A K E S<br>YOU<br>H A P P Y ? <a href="https://t.co/Q2YWFkuuk6">pic.twitter.com/Q2YWFkuuk6</a></p>&mdash; DR. Kek (@Thekeksociety) <a href="https://twitter.com/Thekeksociety/status/1742170879285711130?ref_src=twsrc%5Etfw">January 2, 2024</a></blockquote> 


Use the snippet provided by https://publish.twitter.com/ but remove the Twitter widget `<script />` tag. The `PostPage.tsx` already import it for you (if you set `enableTwitterWidget`?)

```html
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
```


## CSS customization

TODO move all the CSS to few simple CSS classes using TailindCSS

## Links

[](https://github.com/executablebooks/myst-theme/pull/87)

[](https://github.com/executablebooks/mystmd/blob/690f4695bb172d5a0aa05c0f4600064540528029/packages/myst-parser/README.md?plain=1#L5-L24)

<doi:10.5281/zenodo.6476040> or [](doi:10.5281/zenodo.6476040)

Primordial <wiki:gravitational_waves> are hypothesized to arise from <wiki:cosmic_inflation>, a faster-than-light expansion just after the [](wiki:big_bang).

[](rrid:SCR_008394)