---
title: Hello world
description: Quick, short
date: 2024-01-02 22:40:45 +0002
slug: fresh-start
---

It support TeX formatting:

$$ y = x^2 $$

Inline math: $y = x^2$

$$
f(x) = \int_{-\infty}^\infty
    \hat f(\xi)\,e^{2 \pi i \xi x}
    \,d\xi
$$

<!-- ```math
f(x) = \int_{-\infty}^\infty
    \hat f(\xi)\,e^{2 \pi i \xi x}
    \,d\xi
```

```{math}
:label: matrix
Ax = b
```

<pre><code class="language-math">
  L = \frac{1}{2} \rho v^2 S C_L
</code></pre>

### Examples from rehype-katex

<p>
  Lift(<code class="language-math">L</code>) can be determined by Lift Coefficient
  (<code class="language-math">C_L</code>) like the following equation.
</p>
<pre><code class="language-math">
  L = \frac{1}{2} \rho v^2 S C_L
</code></pre> -->

```ts 
// Declare a tuple type
let x: [string, number];

// Initialize it
x = ["hello", 10]; // OK
// Initialize it incorrectly
x = [10, "hello"]; // Error
```