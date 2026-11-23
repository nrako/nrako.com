---
# Sample content for design work. Never published.
title: Demos to try in the page
subtitle: Words that hide, a box that centres, a counter that waits for its script
description: Snippets at work, from the smallest demo of hidden text to one that needs a script.
date: 2026-11-20
---

A demo is worth more than its description when the subject is what a browser
does. Each snippet below is a few lines of HTML and CSS, rendered in the page
and shown as typed. Each has a page of its own too, where its words are the
only ones.

## Words a selection carries along

These hide or move a few words without taking them out of the text. Select
from the first point to the last, copy a link to the selection, and read what
the link carries. The hidden words are in another language in each demo, so
that no two demos say the same thing.

:::{snippet} Moved away: `transform: translate(...)`
:label: hidden-by-transform

```html
<p>
  Point A,
  <span class="secret">contains sensible secret</span>
  till point B.
</p>
```

```css
p {
  margin-bottom: 2rem;
}

.secret {
  display: inline-block;
  transform: translateY(2rem);
  color: #dc2626;
}
```
:::

:::{snippet} Set in a corner: `position: absolute`
:label: hidden-by-position

```html
<p>
  Punto C,
  <span class="secret">contiene secreto</span>
  hasta el punto D.
</p>
```

```css
.secret {
  position: absolute;
  top: 0;
  right: 1rem;
  color: #dc2626;
}
```
:::

:::{snippet} There and not seen: `opacity: 0`
:label: hidden-by-opacity

```html
<p>
  Point E,
  <span class="secret">information secrète</span>
  jusqu'à point F.
</p>
```

```css
.secret {
  opacity: 0;
}
```
:::

:::{snippet} Not selectable: `user-select: none`
:label: hidden-unselectable

```html
<p>
  Punkt G,
  <span class="secret">enthält Geheimnisse</span>
  bis Punkt H.
</p>
```

```css
p {
  margin-bottom: 2rem;
}

.secret {
  display: inline-block;
  transform: translateY(2rem);
  user-select: none;
  color: #dc2626;
}
```
:::

The same in a layout that could be real: a record whose diagnosis is drawn
apart from the lines around it. In [](#hidden-in-a-record), select the name
or the case number alone.

:::{snippet} A record with a diagnosis set apart
:label: hidden-in-a-record

```html
<div class="record">
  Patient name: John Smith
  <span class="diagnosis">Stage 2 cancer</span>
  Case ID: #23Y52822FGS
</div>
```

```css
.record {
  padding-right: 9rem;
}

.diagnosis {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #dc2626;
}
```
:::

And the one place where the words are not text at all, the value of a field:

:::{snippet} Words in a disabled field
:label: text-in-a-field

```html
<p>
  Text with
  <input value="critical info" disabled />
  in a disabled field.
</p>
```

```css
input {
  width: 8rem;
  padding: 0 0.25rem;
  border: 1px solid currentColor;
  color: #dc2626;
}
```
:::

## A layout

A snippet is not only for text. This one centres a box both ways, and its
rule for `.box` colours no other box on the page.

:::{snippet} Centred with flexbox
:label: flex-center

```html
<div class="stage">
  <div class="box">Centered content</div>
</div>
```

```css
.stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
}

.box {
  padding: 20px;
  border-radius: 8px;
  background: #e2e8f0;
  color: #0f172a;
}
```
:::

## A script

A snippet shows a script and does not run it: the counter of
[](#counter) is drawn, and its buttons do nothing yet.

:::{snippet} A counter
:label: counter

```html
<div class="counter">
  <p>Counter: <span id="count">0</span></p>
  <div class="buttons">
    <button id="decrement">-</button>
    <button id="increment">+</button>
  </div>
  <button id="reset" class="reset">Reset</button>
</div>
```

```css
.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.buttons {
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border: 2px solid #2563eb;
  border-radius: 0.5rem;
  background: white;
  color: #2563eb;
  font-size: 1.25rem;
  cursor: pointer;
}

button:hover {
  background: #2563eb;
  color: white;
}

.reset {
  border-color: #dc2626;
  color: #dc2626;
}

.reset:hover {
  background: #dc2626;
  color: white;
}
```

```js
let count = 0
const countDisplay = document.getElementById('count')

function updateCount(newCount) {
  count = newCount
  countDisplay.textContent = count
}

document.getElementById('increment').addEventListener('click', () => {
  updateCount(count + 1)
})

document.getElementById('decrement').addEventListener('click', () => {
  updateCount(count - 1)
})

document.getElementById('reset').addEventListener('click', () => {
  updateCount(0)
})
```
:::

A function on its own has nothing to render, and a block of code with a
caption is enough for it:

```{code} js
:label: code-debounce
:caption: A function that waits for calls to stop

function debounce(func, wait) {
  let timeout

  return function debounced(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
```
