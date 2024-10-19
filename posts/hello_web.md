---
title: Hello Open Web!
description: A first small post to start my writing journey, explaining my motives and what's behind it.
date: 2024-10-19
tags:
  - Deno
  - Fresh
---

Ah, the good old world wide web&thinsp;! The open web&thinsp;!

I missed writing. I wanted to share thoughts, ideas, essays and projects for far
too long — probably years&thinsp;!

Authoring is a crucial skill to me, for both work and personal expression. It's
a consuming exercise, sometimes emotional and introspective, but deeply human
and always reflective.

The journey of crafting a coherent piece of text is simply _highly underrated_.
Now that AI and large language models are disrupting everything, I've come to
value the exercise of writing more than ever.

These days, we "humans" aimlessly scroll through feeds of mindless rants and
visuals of all sorts, mostly posted by reaction-seekers. Too often, I found
myself in dismay and at a loss in my experience with social networks — somehow
unable to do more than consume, "retweet", or fall into the trap of ranting.

Now I have the urge to rediscover the pleasure of expressing myself, sharing and
crafting with thought and intent in a non-toxic space.

---

> The best format will always be the one we shape to match our purest
> expression.
>
> The best space will always be safe and open.
>
> Own both, or your expression will be framed into someone else space, under
> someone else rules.

---

In this personal space, where I'll freely and openly share my thoughts, I wanted
to start afresh — on a website under my control.

No platforms, no social networks, no excessive tools. **Screw those
centralized-gate-keepers-algo-manipulators&thinsp;!** Just good old web
standards and a few effective lines of code.

Recently, [Deno](https://deno.com) and its [🍋 Fresh](https://fresh.deno.dev)
framework caught my interest; I could say more about why and probably will in
the future — but for this post, what matters is that my quest for a new personal
website gave me the perfect pretext to explore this new stack.

As a result, I also started a Blog plugin for Fresh
http://github.com/nrako/fresh_blog_plugin. ⚠️ It's a work in progress
🚧&thinsp;! And yes, there are other Fresh blog plugins, but none that make use
of MyST.

[MyST (Markedly Structured Text)](https://mystmd.org) is another brilliant and
noteworthy open source project. It's basically a superset of markdown
(CommonMark) for technical and scientific authoring. The MyST project offers
much more, but what really caught my attention is its parser and HTML
transformers for this markdown flavor.

MyST is great for technical writers, coders, and more, but I believe that the
scientific and academic rigor it enables can also benefit many web publications
— especially when it comes to referencing and citing other works and authors.

Additionally, I have some ideas I'd like to experiment with, particularly around
publications, sharing, and reactions. For that I need to fully control the space
and code.

For now, and at the time of this first post, my MyST integration is very crude,
and I simply dumped some logic from my WIP 🚧 plugin directly into my website's
source. This was necessary because I wanted to experiment with the bleeding edge
of what Deno has to offer; though I encountered a few temporary issues. JSR does
not yet love JSX (.tsx files) [^issue-jsr] and Fresh v2 is still in alpha and
will have significant changes to its plugin interface [^fresh-roadmap]. But as
soon as things gets more stable, I'll make sure to release my little plugin and
make use of it here on my website.

—my little safe space on the Web.

[^issue-jsr]: JSR issue for publishing JSX/TSX files
    https://github.com/jsr-io/jsr/issues/24

[^fresh-roadmap]: Roadmap to Fresh v2
    https://github.com/denoland/fresh/issues/2363
