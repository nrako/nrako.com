---
# Sample content for design work. Never published.
title: What a post can set
subtitle: Every piece of markup this site renders, on one page
description: A tour of the MyST markup a post can use here, from citations to callouts, each one rendered as written.
date: 2026-11-22
bibliography: what-a-post-can-set.bib
---

A post is a Markdown file, and Markdown was made to be read as it is typed
[@gruber2004]. This site reads a superset of it,
[MyST](https://mystmd.org), which adds what a careful text needs: notes,
citations, numbered figures and references between them. This page uses each
piece once, so that its source doubles as a reference.

Everything here is rendered and tested. What MyST defines but this site does
not render yet is listed [at the end](#not-rendered).

## Text

Plain Markdown does the usual: *emphasis*, **strong emphasis**, `inline code`
and [links](https://mystmd.org/guide). "Straight quotes" are set as
typographic ones, and an address written bare, such as mystmd.org, becomes a
link.

A few roles cover what Markdown has no syntax for:

- an abbreviation that spells itself out on hover, as
  {abbr}`MyST (Markedly Structured Text)`;
- subscript and superscript, as in H{sub}`2`O and the 4{sup}`th` of July;
- a key to press, {kbd}`Ctrl` + {kbd}`C`;
- a deletion, {del}`left in the text on purpose`.

Inline HTML passes through, which gives a <mark>highlight</mark> when one is
needed.

## Links that write themselves

Some links know what to call themselves. An address between angle brackets is
shortened to what matters:

- a Wikipedia article, <wiki:Hypertext>, or one given a text of its own,
  [the man who proposed the web](wiki:Tim_Berners-Lee);
- a DOI, <doi:10.1093/comjnl/27.2.97>;
- a GitHub pull request, <https://github.com/jupyter-book/mystmd/pull/3083>.

## Notes

A note is a number in the text and its body at the foot of the post.[^short]
The same note can be called twice,[^short] and a note can run over several
paragraphs.[^long]

[^short]: A short note. The arrow after it leads back to where it was called.

[^long]: A long note starts like any other.

    Its next paragraphs are indented under it.

## Citations

A post that lists a `bibliography` in its frontmatter can cite the works of
that BibTeX file by their key. The works it cites are listed under
"References" at the end of the post, sorted by name, and every citation links
to its entry.

In the text, a key after an @ names the authors and gives the year in
parentheses: @knuth1984 asked that programs be written as literature, for
people to read. A page or a chapter goes in brackets right after the key, as in
@lamport1994 [ch. 2].

In brackets, the whole citation is parenthetical, and several works are
separated by semicolons. Separating what a text says from how it looks is an
old idea [@lamport1994; see also @bringhurst2004]. A hyphen before the
@ leaves the authors out when the sentence already names them: Kernighan and
Ritchie open their book with a program that prints two words
[-@kernighan1988, p. 6].

Two authors are both named, as @kernighan1988; three or more become the first
one *et al.*, as @berners-lee2005.

The `{cite}` roles do the same from MyST's own syntax:
{cite:t}`gruber2004` in the text and {cite:p}`knuth1984; gruber2004` in
parentheses.

An @ only cites in a post that lists a bibliography. There, an @ meant as
text is escaped with a backslash, as in \@someone.

(labels)=
## References between parts

A fragment identifier points inside a document [@berners-lee2005, sec. 3.5],
and anything that has one can be referred to. Every heading gets one from its
text, so a link can lead to [the section on notes](#notes). A label written
above a heading, as `(labels)=` above this one, gives it a name that survives
a change of title: [this section](#labels).

A link without a text takes the name of what it points to: [](#labels) for a
section, [](#fig-pipeline) for a figure. A link that stays on the page, as
these and the citations do, is underlined with dots; one that leaves it, with
a line.

Figures, tables, equations and captioned code are numbered, and a reference to
their label takes the number: {numref}`fig-pipeline`, {numref}`tbl-syntax`,
{numref}`code-greet` and equation {eq}`eq-pythagoras` are all further down.
The text of such a reference can be chosen, as in
{numref}`Fig. %s <fig-pipeline>`.

(a-labelled-paragraph)=
A label can also name a paragraph, a list, a quotation or a callout. This
paragraph has one, and [a link to it](#a-labelled-paragraph) lands here.

## Figures

:::{figure} /samples/from-source-to-page.svg
:label: fig-pipeline
:alt: A post goes from Markdown to a tree, then to HTML
:width: 90%
:align: center

A figure has a caption and a number. This one draws what the site does
with a post.
:::

An image without a caption is the `{image}` directive, with the same options
for its width and alignment.

## Tables

A pipe table is plain Markdown:

| Syntax       | Renders as        |
| ------------ | ----------------- |
| `*text*`     | *text*            |
| `**text**`   | **text**          |
| `` `text` `` | `text`            |

The `{table}` directive adds a caption and a number to one:

:::{table} What each citation syntax gives
:label: tbl-syntax

| Syntax               | In the text            |
| -------------------- | ---------------------- |
| `@key`               | Authors (year)         |
| `[@key]`             | (Authors, year)        |
| `[-@key]`            | (year)                 |
| `[see @key, p. 3]`   | (see Authors, year, p. 3) |
:::

And `{list-table}` writes a table as a list, which is easier when the cells
are long:

:::{list-table} A table written as a list
:header-rows: 1

* - Directive
  - What it is for
* - `{table}`
  - A caption and a number for a pipe table
* - `{list-table}`
  - Rows as list items, one cell per line
:::

## Lists

Lists nest, and a list can be a checklist:

1. A numbered item
   - with a nested one
   - and another
2. A second numbered item

- [x] Write the post
- [ ] Publish it

A definition list pairs a term with what it means:

Role
: Markup inside a line, written as `` {name}`text` ``.

Directive
: Markup for a block, written between `:::{name}` and `:::`.

## Quotations

A quotation whose last line starts with two hyphens is attributed:

> Programs must be written for people to read, and only incidentally for
> machines to execute.
>
> -- Harold Abelson and Gerald Jay Sussman

The `{epigraph}` and `{pull-quote}` directives set a quotation apart from the
text around it:

:::{epigraph}
The details are not the details. They make the design.

-- Charles Eames
:::

## Callouts

A callout sets a block apart. Each kind has its title, as `{note}`, `{tip}`,
`{important}`, `{warning}` or `{seealso}`:

:::{note}
The body of a callout is ordinary markup: a list, a link, `some code`.
:::

A kind takes another title when it is given one:

:::{warning} Mind the order
A label goes above what it names, not below.
:::

And `{admonition}` has no kind, only the title it is given:

:::{admonition} A callout with its own title
It is the plainest of them.
:::

## Math

Math is set inline, as {math}`e^{i\pi} + 1 = 0` or between dollars as
$a^2 + b^2 = c^2$, and as a block that can carry a label:

```{math}
:label: eq-pythagoras
a^2 + b^2 = c^2
```

## Code

A fenced block is highlighted in the site's theme, in light and dark:

```c
#include <stdio.h>

int main(void)
{
    printf("hello, world\n");
    return 0;
}
```

The `{code}` directive adds a caption, and a number once it has a label:

```{code} ts
:label: code-greet
:caption: A function with a caption

export function greet(name: string): string {
  return `hello, ${name}`
}
```

And a comment at the end of a line marks it as removed or added:

```ts
const greeting = 'hello' // [!code --]
const greeting = 'hello, world' // [!code ++]
```

## Snippets

A snippet shows a small piece of HTML, CSS and JavaScript twice from one
source: as it renders, then as it is typed. The demo is part of the page, so its text is
selected, searched and linked to like the rest, and its CSS styles nothing
outside it.

:::{snippet} Words that are there and cannot be seen
:label: ex-unseen

```html
<p>A sentence with <span class="unseen">words nobody sees</span> in it.</p>
```

```css
.unseen {
  opacity: 0;
}
```
:::

A snippet is numbered and referred to as a figure is: [](#ex-unseen) hides
part of its sentence. Select that sentence from end to end, copy it, and the
hidden words come along.

A snippet that has a label also has a page of its own under its post, at
`snippets/` and its label, with the demo and nothing else. Here the demo's
words are on the page twice, once rendered and once in its source; there they
are the only text, until `?source` is added to the address, which shows the
sources there too.

Sources that run long are set as tabs, one shown at a time, so that the demo
stays in view. The ones on this page are short and stay one under the other.

A `js` block is the demo's script. It runs in the page, after the demo's
HTML, and finds its elements by an `id` that nothing else on the page has:

:::{snippet} Words that a button shows
:label: ex-shown

```html
<p>A sentence with <span id="ex-shown-words" hidden>more words</span> in it.</p>
<button id="ex-shown-button">Show or hide the words</button>
```

```js
const words = document.getElementById('ex-shown-words')

document.getElementById('ex-shown-button').addEventListener('click', () => {
  words.hidden = !words.hidden
})
```
:::

## Raw HTML

A block of HTML passes through, and the Markdown inside it is still read:

<details>
<summary>A disclosure, closed by default</summary>

Its content is *Markdown*.

</details>

A line that starts with a percent sign is a comment: there is one in the
source below this paragraph, and it does not show.

% This line is only in the source.

(not-rendered)=
## Not rendered yet

MyST defines more than this site renders. Until these work, a post should not
use them:

- `{dropdown}`, `{tab-set}`, `{glossary}` with `{term}`, `{include}`,
  `{literalinclude}`, `{iframe}` and `{mermaid}`;
- the `{underline}`, `{smallcaps}`, `{span}` and `{index}` roles;
- the number of an equation beside it, and the number of a figure or a table
  that has no label: both are counted, neither is shown;
- `:linenos:`, `:emphasize-lines:` and `:filename:` on a block of code;
- a citation followed at once by a note, which takes the note for its page.
