---
title: Fixture post
description: A test fixture that stands in for a post.
date: 2026-01-20
bibliography: fixture-post.bib
---

This post only exists for the e2e tests. It is never published: the site is
built from this directory only when `POSTS_DIR` points at it.

## A section

A post shows its date and its reading time.

## Some math

A post can set math, inline as {math}`e = mc^2` or as a block:

```{math}
\int_0^1 x^2 \, dx = \frac{1}{3}
```

## Some citations

A post cites the works of its bibliography: @fixture2020 in the text, or in
parentheses [see @sample2019, p. 3; @fixture2020]. A key the bibliography does
not hold, as @missing2021, stays in the text.

## Some keys

A post names a key to press, as {kbd}`Ctrl`, sets a <mark>highlight</mark> and
spells out an abbreviation, as {abbr}`MyST (Markedly Structured Text)`.

## Some code

A post highlights its code in the site's theme:

```ts
const answer = 42
```
