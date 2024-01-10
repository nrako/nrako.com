---
title: Markdown Features
description: catalogue of markdown features
date: 2024-01-01 22:40:45 +0002
---

This file demo all Markdown features which should be supported by the processor.

# 1 CommonMark

First of all the processor supports the [CommonMark](https://commonmark.org) specss.

## 1.2 Preliminaries

### 1.2.4 Backslashes escapes

Any ASCII punctuation character may be backslash-escaped:

[Example 12](https://spec.commonmark.org/0.30/#example-12)

\!\"\#\$\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\|\}\~

Backslashes before other characters are treated as literal backslashes:

[Example 13](https://spec.commonmark.org/0.30/#example-13)

\→\A\a\ \3\φ\«

Escaped characters are treated as regular characters and do not have their usual Markdown meanings:

[Example 14](https://spec.commonmark.org/0.30/#example-14)

\*not emphasized*
\<br/> not a tag
\[not a link](/foo)
\`not code`
1\. not a list
\* not a list
\# not a heading
\[foo]: /url "not a reference"
\&ouml; not a character entity

### 1.2.5 Entity and numeric character references

[Example 25](https://spec.commonmark.org/0.30/#example-25)

&nbsp; &amp; &copy; &AElig; &Dcaron;
&frac34; &HilbertSpace; &DifferentialD;
&ClockwiseContourIntegral; &ngE;


[Example 26](https://spec.commonmark.org/0.30/#example-26)

&#35; &#1234; &#992; &#0;

[Example 27](https://spec.commonmark.org/0.30/#example-27)

&#X22; &#XD06; &#xcab;

## 1.3 Block and inlines

Indicators of block structure always take precedence over indicators of inline structure.

### 1.3.1 Precedence

[Example 42](https://spec.commonmark.org/0.30/#example-42)

- `one
- two`

## 1.4 Leaf Blocks

This section describes the different kinds of leaf block that make up a Markdown document.

### 1.4.1 Thematic breaks

Do `<hr/>` with:

[Example 43](https://spec.commonmark.org/0.30/#example-43)

***
---
___

More than three characters may be used:

[Example 50](https://spec.commonmark.org/0.30/#example-50)

_____________________________________


Spaces and tabs are allowed between the characters:

[Example 51-53](https://spec.commonmark.org/0.30/#example-51)
 - - -
 **  * ** * ** * **
-     -      -      -


### 1.4.2 ATX Headings

Simple headings:

[Example 62](https://spec.commonmark.org/0.30/#example-62)

# Foo
## Foo
### Foo
#### Foo
##### Foo
###### Foo

Up to three spaces of indentation are allowed:

[Example 68](https://spec.commonmark.org/0.30/#example-68)

 ### Foo
  ## Foo
   # Foo


### 1.4.3 Setext headings

[Example 80](https://spec.commonmark.org/0.30/#example-80)

Foo *bar*
=========

Foo *bar*
---------

The content of the header may span more than one line:

[Example 81](https://spec.commonmark.org/0.30/#example-81)

Foo *bar
baz*
====


The underlining can be any length:

[Example 83](https://spec.commonmark.org/0.30/#example-83)

Foo
-------------------------

Foo
=


### 1.4.4 Indented code blocks

An indented code block cannot interrupt a paragraph, so there must be a blank line between a paragraph and a following indented code block. (A blank line is not needed, however, between a code block and a following paragraph.)

[Example 107](https://spec.commonmark.org/0.30/#example-107)

    a simple
      indented code block


### 1.4.5 Fenced code blocks

With backticks:

[Example 119](https://spec.commonmark.org/0.30/#example-119)

```
<
 >
```

With tildes:

[Example 120](https://spec.commonmark.org/0.30/#example-120)

~~~
<
 >
~~~


[Example 142](https://spec.commonmark.org/0.30/#example-142)

```ruby
def foo(x)
  return 3
end
```


[Example 143](https://spec.commonmark.org/0.30/#example-143)
~~~~    ruby startline=3 $%@#$
def foo(x)
  return 3
end
~~~~


### 1.4.6 HTML blocks

For instance, `<pre>` within an HTML block started by `<table>` will not affect the parser state; as the HTML block was started in by start condition 6, it will end at any blank line. This can be surprising:

[Example 149](https://spec.commonmark.org/0.30/#example-148)

<table><tr><td>
<pre>
**Hello**,

_world_.
</pre>
</td></tr></table>


[Example 167](https://spec.commonmark.org/0.30/#example-167)

<del>

*foo*

</del>


[Example 169](https://spec.commonmark.org/0.30/#example-169)

<pre language="haskell"><code>
import Text.HTML.TagSoup

main :: IO ()
main = print $ parseTags tags
</code></pre>
okay

### 1.4.7 Link reference definitions

[Example 192](https://spec.commonmark.org/0.30/#example-192)

[foo]: /url "title"

[foo]


## 1.5 Container block

### 1.5.1 Block quotes

[Example 228](https://spec.commonmark.org/0.30/#example-228)

> # Foo
> bar
> baz

### 1.5.2 List items

[Example 281](https://spec.commonmark.org/0.30/#example-281)

- foo
-
- bar

[Example 283](https://spec.commonmark.org/0.30/#example-283)

1. foo
2.
3. bar

[Example 296](https://spec.commonmark.org/0.30/#example-296)

10) foo
    - bar

### 1.5.3 Lists

[Example 301](https://spec.commonmark.org/0.30/#example-301)

- foo
- bar
+ baz

[Example 302](https://spec.commonmark.org/0.30/#example-302)

1. foo
2. bar
3) baz

## 1.6 Inlines

### 1.6.1 Code spans

Inline `code`

### 1.6.2 Emphasis and strong emphasis

| option 1 | option 2 |
| --- | --- |
| *Italic* | _Italic_ |
| **Bold** | __Bold__ |

### 1.6.3 Links

[Example 481](https://spec.commonmark.org/0.30/#example-481)

[link](/uri "title")

[Example 483](https://spec.commonmark.org/0.30/#example-483)

[](./target.md)

[Example 526](https://spec.commonmark.org/0.30/#example-526)

[foo][bar]

[bar]: /url "title"

### 1.6.4 Images

[Example 571](https://spec.commonmark.org/0.30/#example-571)

![foo](/url "title")

[Example 572](https://spec.commonmark.org/0.30/#example-572)

![foo *bar*]

[foo *bar*]: train.jpg "train & tracks"

### 1.6.5 Autolinks

[Example 593](https://spec.commonmark.org/0.30/#example-593)

<http://foo.bar.baz>


[Example 603](https://spec.commonmark.org/0.30/#example-603)

<foo@bar.example.com>


### 1.6.6 Raw HTML


#### 1.6.6.1 It support YouTube Embed through iFrame:

<iframe class="w-full aspect-video"
src="https://www.youtube.com/embed/4boXExbbGCk" 
frameborder="0" 
allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
allowfullscreen></iframe>

Pro-tip: use `class="w-full aspect-video` instead of `width="560" height="315"`


#### 1.6.6.2 Embed Twitter (X)

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">WHAT<br> M A K E S<br>YOU<br>H A P P Y ? <a href="https://t.co/Q2YWFkuuk6">pic.twitter.com/Q2YWFkuuk6</a></p>&mdash; DR. Kek (@Thekeksociety) <a href="https://twitter.com/Thekeksociety/status/1742170879285711130?ref_src=twsrc%5Etfw">January 2, 2024</a></blockquote> 


Use the snippet provided by https://publish.twitter.com/ but remove the Twitter widget `<script />` tag. The `PostPage.tsx` already import it for you (if you set `enableTwitterWidget`?)

```html
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
```


# 2 GitHub Flavored Markdown Spec (GFM)

The processor also support the Github Flavored Markdown extensions.

## 2.1 Table GFM extension

[Example GFM 198](https://github.github.com/gfm/#example-198)

| foo | bar |
| --- | --- |
| baz | bim |

[Example GFM 199](https://github.github.com/gfm/#example-199)

| abc | defghi |
:-: | -----------:
bar | baz

## 2.2 Task list items GFM extension

[Example GMF 279](https://github.github.com/gfm/#example-279)

- [ ] foo
- [x] bar

[Example GMF 280](https://github.github.com/gfm/#example-280)

- [x] foo
  - [ ] bar
  - [x] baz
- [ ] bim


## 6.5 Striketrough GFM extension

[Example GMF 491](https://github.github.com/gfm/#example-491)

~~Hi~~ Hello, ~there~ world!