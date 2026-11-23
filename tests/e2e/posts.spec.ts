import { expect, test, type Page } from '@playwright/test'
import { decompress } from 'livecodes'
import { skipWithoutFixturePosts } from './fixtures'

// The tests about posts only apply once a post is published. Call this after
// loading /posts.
async function skipWithoutPosts(page: Page) {
  test.skip(
    (await page.getByRole('article').count()) === 0,
    'no post is published',
  )
}

test.describe('Posts listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts')
  })

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Posts | nrako.com')
  })

  test('says so when nothing is published', async ({ page }) => {
    test.skip(
      (await page.getByRole('article').count()) > 0,
      'a post is published',
    )

    await expect(page.getByText('No posts yet.')).toBeVisible()
  })

  test('displays post cards with titles', async ({ page }) => {
    await skipWithoutPosts(page)

    const articles = page.getByRole('article')

    await expect(articles.first()).toBeVisible()
    await expect(articles.first().getByRole('heading')).toBeVisible()
  })

  test('post cards are links to individual posts', async ({ page }) => {
    await skipWithoutPosts(page)

    const firstPostLink = page.locator('.post-entry').first()

    await expect(firstPostLink).toHaveAttribute('href', /^\/posts\//)
  })

  test('clicking a post navigates to the post page', async ({ page }) => {
    await skipWithoutPosts(page)

    const firstPost = page.getByRole('article').first()
    const postTitle = await firstPost.getByRole('heading').textContent()

    await firstPost.click()

    await expect(page).toHaveURL(/\/posts\//)
    await expect(page.getByRole('heading', { name: postTitle! })).toBeVisible()
  })
})

test.describe('Individual post', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts')
    await skipWithoutPosts(page)

    // Navigate to first post
    await page.getByRole('article').first().click()
  })

  test('displays post content', async ({ page }) => {
    // Post should have a main heading
    const mainContent = page.getByRole('main')
    await expect(mainContent.getByRole('heading').first()).toBeVisible()

    // Post should have article content
    await expect(page.locator('.post-content')).toBeVisible()
  })

  test('displays post metadata', async ({ page }) => {
    // Should have a time element for the date
    await expect(page.locator('time').first()).toBeVisible()

    // Should have reading time
    await expect(page.getByText(/min read|Less than a minute/)).toBeVisible()
  })
})

test.describe('Post versions', () => {
  test('an older version is served as its own page', async ({ page }) => {
    await page.goto('/posts')
    await skipWithoutPosts(page)

    await page.getByRole('article').first().click()
    await expect(page.locator('.post-content')).toBeVisible()

    // Version history comes from the GitHub API and needs GITHUB_TOKEN.
    const versionLinks = page.locator('#versions-popover a')
    test.skip(
      (await versionLinks.count()) < 2,
      'no version history (GITHUB_TOKEN not set?)',
    )

    // The first entry is the latest version and links to the post itself
    await expect(versionLinks.first()).toHaveAttribute(
      'href',
      /^\/posts\/[^/]+$/,
    )

    const oldestHref = await versionLinks.last().getAttribute('href')
    expect(oldestHref).toMatch(/^\/posts\/[^/]+\/[0-9a-f]{7}$/)

    await page.goto(oldestHref!)

    await expect(page.getByText('You are looking at version')).toBeVisible()
    await expect(page.locator('.post-content')).toBeVisible()
  })
})

test.describe('Citations', () => {
  test.beforeEach(() => {
    skipWithoutFixturePosts()
  })

  test('the references list the cited works, sorted by name', async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post')

    const references = page.locator('.post-content .references')

    await expect(
      references.getByRole('heading', { name: 'References' }),
    ).toBeVisible()
    await expect(references.getByRole('listitem')).toHaveText([
      /^Fixture, A\. \(2020\)\. A Book That Stands In for a Book/,
      /^Sample, B\., Fixture, A\., & Stub, C\. \(2019\)/,
    ])
  })

  test('a citation leads to its entry in the references', async ({ page }) => {
    await page.goto('/posts/fixture-post')

    await page.getByRole('link', { name: 'Fixture (2020)' }).click()

    await expect(page).toHaveURL(/#cite-fixture2020$/)
    await expect(page.locator('#cite-fixture2020')).toBeInViewport()
  })

  test('a citation is underlined with dots, a link that leaves the page with a line', async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post')

    await expect(page.getByRole('link', { name: 'Fixture (2020)' })).toHaveCSS(
      'text-decoration-style',
      'dotted',
    )
    await expect(
      page.getByRole('link', { name: 'https://example.com/an-article' }),
    ).toHaveCSS('text-decoration-style', 'solid')
  })

  test('a key the bibliography does not hold stays in the text', async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post')

    await expect(page.locator('.post-content')).toContainText(
      'as @missing2021, stays in the text',
    )
  })

  test('an @ is text in a post without a bibliography', async ({ page }) => {
    await page.goto('/posts/fixture-short-post')

    await expect(page.locator('.post-content')).toContainText(
      '@someone, [@a-note].',
    )
    await expect(page.locator('.references')).toHaveCount(0)
  })
})

test.describe('Markup', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`a key and a highlight are in the text's colour in ${colorScheme} mode`, async ({
      page,
    }) => {
      skipWithoutFixturePosts()
      await page.emulateMedia({ colorScheme })
      await page.goto('/posts/fixture-post')

      const textColour = await page
        .locator('.post-content p')
        .first()
        .evaluate((paragraph) => getComputedStyle(paragraph).color)

      await expect(page.locator('.post-content kbd')).toHaveCSS(
        'color',
        textColour,
      )

      const highlight = page.locator('.post-content mark')

      await expect(highlight).toHaveCSS('color', textColour)
      // Not the browser's own yellow
      await expect(highlight).not.toHaveCSS(
        'background-color',
        'rgb(255, 255, 0)',
      )
    })
  }
})

test.describe('Snippets', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutFixturePosts()
    await page.goto('/posts/fixture-post')
  })

  test("a snippet's CSS styles its demo and nothing else", async ({ page }) => {
    const content = page.locator('.post-content')

    await expect(content.locator('.snippet-demo .secret')).toHaveCSS(
      'opacity',
      '0',
    )
    await expect(
      content.locator('.secret').filter({ hasText: 'the same class' }),
    ).toHaveCSS('opacity', '1')
  })

  test("a snippet's demo is text of the page, not a frame", async ({
    page,
  }) => {
    const snippet = page.locator('#ex-fixture')

    await expect(snippet.locator('iframe')).toHaveCount(0)
    await expect(snippet.locator('.snippet-demo')).toHaveText('Seen, unseen.')
    // The demo, then its two sources, each under the name of its language
    await expect(snippet.locator('pre.shiki')).toHaveCount(2)
    await expect(snippet.locator('.snippet-language')).toHaveText([
      'HTML',
      'CSS',
    ])
  })

  test('a snippet is numbered, and a reference leads to it', async ({
    page,
  }) => {
    await expect(page.locator('#ex-fixture figcaption p').first()).toHaveText(
      /^Example\s1: A fixture snippet$/,
    )

    await page.getByRole('link', { name: /^Example\s1$/ }).click()

    await expect(page).toHaveURL(/#ex-fixture$/)
    await expect(page.locator('#ex-fixture')).toBeInViewport()
  })
})

test.describe('Snippet scripts', () => {
  // A snippet's script runs wherever its demo is set
  for (const address of [
    '/posts/fixture-post',
    '/posts/fixture-post/snippets/ex-script',
  ]) {
    test(`a snippet's script runs in its demo on ${address}`, async ({
      page,
    }) => {
      skipWithoutFixturePosts()
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))

      await page.goto(address)

      const pressed = page.locator('#fixture-pressed')
      await expect(pressed).toHaveText('0')

      await page.getByRole('button', { name: 'Press' }).click()
      await page.getByRole('button', { name: 'Press' }).click()

      await expect(pressed).toHaveText('2')
      expect(errors).toEqual([])
    })
  }
})

test.describe('Snippet consoles', () => {
  test.beforeEach(() => {
    skipWithoutFixturePosts()
  })

  test("in a post, a snippet's console holds what the post says it writes", async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post')

    // As written, and never what the script writes
    await expect(page.locator('#ex-console .snippet-console')).toHaveText(
      'written by hand, <not> run',
    )
    await expect(page.locator('#ex-console pre.shiki')).toHaveCount(1)
    await expect(page.locator('#ex-console .snippet-language')).toHaveText([
      'JavaScript',
    ])

    // After the script that writes to it, and a script alone shows no demo
    const script = await page.locator('#ex-console pre.shiki').boundingBox()
    const written = await page
      .locator('#ex-console .snippet-console')
      .boundingBox()
    expect(written!.y).toBeGreaterThanOrEqual(script!.y + script!.height)
    await expect(page.locator('#ex-console .snippet-demo')).toBeHidden()
  })

  test("on its page, a snippet's console holds what its script writes", async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post/snippets/ex-console')

    const written = page.locator('.snippet-console')
    await expect(written).toHaveText('counted 2\n{"of":"an object"}\n')
    await expect(written.locator('[data-level="warn"]')).toHaveText(
      '{"of":"an object"}\n',
    )
    // The console's text is all the text of the page
    await expect(page.locator('body')).toHaveText(
      /^counted 2\s+\{"of":"an object"\}\s*$/,
      { useInnerText: true },
    )
  })

  test('an edited script writes to the console again', async ({ page }) => {
    await page.goto('/posts/fixture-post/snippets/ex-console?source')

    const written = page.locator('.snippet-console')
    await expect(written).toHaveText('counted 2\n{"of":"an object"}\n')

    await page.getByLabel('JavaScript').fill("console.log('edited', 2 + 2)")

    // What was written before is gone with the demo that wrote it
    await expect(written).toHaveText('edited 4\n')
    // The console block is not a source: it has no field
    await expect(page.locator('.snippet-pane')).toHaveCount(1)
  })

  test('the console is the foot of the page, under the sources', async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post/snippets/ex-console?source')

    const pane = await page.locator('.snippet-pane').boundingBox()
    const written = await page.locator('.snippet-console').boundingBox()
    expect(written!.y).toBeGreaterThanOrEqual(pane!.y + pane!.height)
    // As wide as the bench, whatever the number of panes above it
    const bench = await page.locator('.snippet-editor').boundingBox()
    expect(Math.round(written!.width)).toBe(Math.round(bench!.width))
  })

  test('the playground of a snippet with a console opens with its console', async ({
    page,
  }) => {
    // What the link asks of the playground, read back from its fragment
    const tools = async (label: string) => {
      await page.goto(`/posts/fixture-post/snippets/${label}?source`)
      const link = page.locator('.snippet-continue')
      await expect(link).toHaveAttribute('href', /#config=code/)

      const address = new URL((await link.getAttribute('href'))!)
      const config = new URLSearchParams(address.hash.slice(1)).get('config')!
      return JSON.parse(decompress(config.slice('code/'.length))!).tools
    }

    expect(await tools('ex-console')).toEqual({
      active: 'console',
      status: 'open',
    })
    expect(await tools('ex-script')).toBeUndefined()
  })
})

test.describe('Snippet sources', () => {
  test('long sources are tabs that show one source at a time', async ({
    page,
  }) => {
    skipWithoutFixturePosts()
    await page.goto('/posts/fixture-post')

    const snippet = page.locator('#ex-script')
    const sources = snippet.locator('.snippet-source')
    const tab = (name: string) =>
      snippet.locator('.snippet-tablist label', { hasText: name })

    await expect(snippet.locator('.snippet-tablist label')).toHaveText([
      'HTML',
      'CSS',
      'JavaScript',
    ])
    await expect(sources.nth(0)).toBeVisible()
    await expect(sources.nth(1)).toBeHidden()
    await expect(sources.nth(2)).toBeHidden()

    await tab('CSS').click()

    await expect(sources.nth(0)).toBeHidden()
    await expect(sources.nth(1)).toBeVisible()
    await expect(sources.nth(2)).toBeHidden()

    await tab('JavaScript').click()

    await expect(sources.nth(1)).toBeHidden()
    await expect(sources.nth(2)).toBeVisible()
  })

  test('short sources are one under the other, without tabs', async ({
    page,
  }) => {
    skipWithoutFixturePosts()
    await page.goto('/posts/fixture-post')

    const snippet = page.locator('#ex-fixture')

    await expect(snippet.locator('.snippet-tablist')).toHaveCount(0)
    await expect(snippet.locator('.snippet-source').nth(0)).toBeVisible()
    await expect(snippet.locator('.snippet-source').nth(1)).toBeVisible()
  })
})

test.describe('Snippet pages', () => {
  test.beforeEach(() => {
    skipWithoutFixturePosts()
  })

  test('a snippet with a label links to a page that shows its demo alone', async ({
    page,
  }) => {
    const failed: string[] = []
    page.on('response', (response) => {
      if (response.status() >= 400) failed.push(response.url())
    })

    await page.goto('/posts/fixture-post')
    await page
      .locator('#ex-fixture')
      .getByRole('link', { name: 'On a page of its own' })
      .click()

    await expect(page).toHaveURL(/\/posts\/fixture-post\/snippets\/ex-fixture$/)
    // The demo's text is all the text of the page: no source, no site chrome
    await expect(page.locator('body')).toHaveText('Seen, unseen.', {
      useInnerText: true,
    })
    await expect(page.locator('header, footer')).toHaveCount(0)
    await expect(page.locator('.secret')).toHaveCSS('opacity', '0')
    expect(failed).toEqual([])
  })

  test("a snippet's sources are not in the document until asked for", async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post/snippets/ex-fixture')

    // Not hidden: absent. They wait in a <template>, outside the document.
    await expect(page.locator('pre, textarea')).toHaveCount(0)
    expect(await page.evaluate(() => document.body.textContent)).not.toContain(
      '<p>Seen',
    )
    expect(
      await page.evaluate(
        () =>
          (
            document.getElementById('snippet-editor') as HTMLTemplateElement
          ).content.querySelectorAll('textarea').length,
      ),
    ).toBe(2)
  })

  test("a snippet's page shows its sources when its address asks for them", async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post/snippets/ex-fixture')

    const fields = page.locator('.snippet-editor textarea')
    await expect(fields).toHaveCount(0)

    await page.getByRole('link', { name: 'Show and edit the sources' }).click()

    await expect(page).toHaveURL(/\/snippets\/ex-fixture\?source$/)
    // Each source as typed, in a field named after its language
    await expect(page.getByLabel('HTML')).toHaveValue(
      '<p>Seen, <span class="secret">unseen</span>.</p>',
    )
    await expect(page.getByLabel('CSS')).toHaveValue(
      '.secret {\n  opacity: 0;\n}',
    )
    await expect(fields).toHaveCount(2)

    await page.getByRole('link', { name: 'Hide the sources' }).click()

    await expect(page).toHaveURL(/\/snippets\/ex-fixture$/)
    await expect(fields).toHaveCount(0)
  })

  test("a snippet's sources are edited from its post", async ({ page }) => {
    await page.goto('/posts/fixture-post')

    await page
      .locator('#ex-fixture')
      .getByRole('link', { name: 'Edit its sources' })
      .click()

    await expect(page).toHaveURL(
      /\/posts\/fixture-post\/snippets\/ex-fixture\?source$/,
    )
    await expect(page.getByLabel('HTML')).toBeVisible()
  })

  test('editing a source draws the demo again', async ({ page }) => {
    await page.goto('/posts/fixture-post/snippets/ex-fixture?source')

    const demo = page.locator('.snippet-preview')
    await expect(demo.locator('.secret')).toHaveCSS('opacity', '0')

    await page.getByLabel('CSS').fill('.secret {\n  opacity: 0.5;\n}')
    await expect(demo.locator('.secret')).toHaveCSS('opacity', '0.5')

    await page.getByLabel('HTML').fill('<p class="secret">Changed.</p>')
    await expect(demo).toHaveText('Changed.', { useInnerText: true })
    // The edited CSS still applies to the edited HTML
    await expect(demo.locator('.secret')).toHaveCSS('opacity', '0.5')
  })

  test('an edited script runs in the demo', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/posts/fixture-post/snippets/ex-script?source')

    const script = page.getByLabel('JavaScript')
    await script.fill((await script.inputValue()).replace('+ 1', '+ 5'))

    const pressed = page.locator('#fixture-pressed')
    await expect(async () => {
      await page.getByRole('button', { name: 'Press' }).click()
      expect(Number(await pressed.textContent()) % 5).toBe(0)
      expect(Number(await pressed.textContent())).toBeGreaterThan(0)
    }).toPass()
    expect(errors).toEqual([])
  })

  test('a script that does not parse leaves the demo working, and is marked', async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post/snippets/ex-script?source')

    const script = page.getByLabel('JavaScript')
    const pane = page.locator('.snippet-pane', { has: script })
    const pressed = page.locator('#fixture-pressed')
    const written = await script.inputValue()

    // A line that is not finished
    await script.fill(`${written}\nlet = ;`)

    await expect(pane).toHaveAttribute('data-error', '')
    await expect(script).toHaveAttribute('aria-invalid', 'true')
    await expect(script).toHaveAttribute('title', /\S/)
    // The demo keeps the script as it last parsed
    await page.getByRole('button', { name: 'Press' }).click()
    await expect(pressed).toHaveText('1')

    // The rest is still drawn again while the script waits to be finished
    await page
      .getByLabel('HTML')
      .fill(
        '<button id="fixture-press">Push</button>\n<output id="fixture-pressed">0</output>',
      )
    await page.getByRole('button', { name: 'Push' }).click()
    await expect(pressed).toHaveText('1')
    await expect(pane).toHaveAttribute('data-error', '')

    await script.fill(written.replace('+ 1', '+ 5'))

    await expect(script).toHaveAttribute('aria-invalid', 'false')
    await expect(async () => {
      await page.getByRole('button', { name: 'Push' }).click()
      expect(Number(await pressed.textContent()) % 5).toBe(0)
      expect(Number(await pressed.textContent())).toBeGreaterThan(0)
    }).toPass()
  })

  test('a script that fails as it runs is marked with the reason', async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post/snippets/ex-script?source')

    const script = page.getByLabel('JavaScript')
    await expect(script).toHaveAttribute('aria-invalid', 'false')

    await script.fill('throw new Error("on purpose")')

    await expect(script).toHaveAttribute('aria-invalid', 'true')
    await expect(script).toHaveAttribute('title', /on purpose/)
    await expect(
      page.locator('.snippet-pane', { has: script }),
    ).toHaveAttribute('data-error', '')
  })

  test('starting again gives the snippet as written', async ({ page }) => {
    await page.goto('/posts/fixture-post/snippets/ex-fixture?source')

    await page.getByLabel('HTML').fill('<p>Changed.</p>')
    await expect(page.locator('.snippet-preview')).toHaveText('Changed.', {
      useInnerText: true,
    })

    await page
      .getByRole('link', { name: 'Start again from the snippet as written' })
      .click()

    await expect(page.locator('.snippet-preview')).toHaveText('Seen, unseen.', {
      useInnerText: true,
    })
    await expect(page.getByLabel('HTML')).toHaveValue(
      '<p>Seen, <span class="secret">unseen</span>.</p>',
    )
  })

  test('the sources are side by side when the window has room for them', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/posts/fixture-post/snippets/ex-script?source')

    const panes = page.locator('.snippet-pane')
    await expect(panes).toHaveCount(3)
    const boxes = await panes.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect()),
    )
    // One line: each starts where the one before ends
    expect(boxes[0].top).toBe(boxes[1].top)
    expect(boxes[1].top).toBe(boxes[2].top)
    expect(boxes[1].left).toBeGreaterThan(boxes[0].right)
    expect(boxes[2].left).toBeGreaterThan(boxes[1].right)
  })

  test('the editor takes the width of a wide window', async ({ page }) => {
    await page.setViewportSize({ width: 2000, height: 1000 })
    await page.goto('/posts/fixture-post/snippets/ex-script?source')

    await expect(page.locator('.snippet-pane')).toHaveCount(3)
    const { left, right } = await page
      .locator('.snippet-page')
      .evaluate((element) => element.getBoundingClientRect())

    // From one margin of the window to the other, not the layout's column
    expect(left).toBeLessThan(60)
    expect(right).toBeGreaterThan(1940)
  })

  test('the sources take the height the demo leaves in the window', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/posts/fixture-post/snippets/ex-script?source')

    const field = page.getByLabel('JavaScript')
    await expect(field).toBeVisible()
    const { bottom, height } = await field.evaluate((element) =>
      element.getBoundingClientRect(),
    )

    // Down to the foot of the window, which the page does not run past
    expect(height).toBeGreaterThan(400)
    expect(bottom).toBeGreaterThan(740)
    expect(bottom).toBeLessThanOrEqual(800)
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(800)
  })

  test('the editor links to a playground that holds the sources as they stand', async ({
    page,
    baseURL,
  }) => {
    const elsewhere: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== new URL(baseURL!).origin) {
        elsewhere.push(request.url())
      }
    })
    const link = page.getByRole('link', { name: /^Continue in LiveCodes/ })

    await page.goto('/posts/fixture-post/snippets/ex-fixture')
    await expect(link).toBeHidden()

    await page.goto('/posts/fixture-post/snippets/ex-fixture?source', {
      waitUntil: 'networkidle',
    })
    // The sources are in the fragment, which is not sent to the playground
    await expect(link).toHaveAttribute(
      'href',
      /^https:\/\/livecodes\.io\/\?title=A\+fixture\+snippet#config=code(\/|%2F)/,
    )
    await expect(link).toHaveAttribute('target', '_blank')
    const asWritten = await link.getAttribute('href')
    // An icon, until a source is edited: it then says what it is for
    await expect(link.getByText('Continue in LiveCodes')).toBeHidden()

    await page.getByLabel('HTML').fill('<p>Changed.</p>')
    await expect(link).not.toHaveAttribute('href', asWritten!)
    await expect(link.getByText('Continue in LiveCodes')).toBeVisible()

    // And is an icon again once the source is as it was written
    await page
      .getByLabel('HTML')
      .fill('<p>Seen, <span class="secret">unseen</span>.</p>')
    await expect(link.getByText('Continue in LiveCodes')).toBeHidden()

    // Nothing is asked of the playground until the link is followed
    expect(elsewhere).toEqual([])
  })

  test("a snippet's page is not for search engines", async ({ page }) => {
    await page.goto('/posts/fixture-post/snippets/ex-fixture')

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    )
  })

  test("a snippet's page leads back to the snippet in its post", async ({
    page,
  }) => {
    await page.goto('/posts/fixture-post/snippets/ex-fixture')

    await page
      .getByRole('link', { name: 'Back to the post: Fixture post' })
      .click()

    await expect(page).toHaveURL(/\/posts\/fixture-post#ex-fixture$/)
    await expect(page.locator('#ex-fixture')).toBeInViewport()
  })

  test('a snippet that does not exist is not found', async ({ page }) => {
    const response = await page.goto(
      '/posts/fixture-post/snippets/no-such-snippet',
    )

    expect(response?.status()).toBe(404)
  })
})

test.describe('Abbreviations', () => {
  test('an abbreviation is not underlined as a link is', async ({ page }) => {
    skipWithoutFixturePosts()
    await page.goto('/posts/fixture-post')

    const abbreviation = page.locator('.post-content abbr')

    await expect(abbreviation).toHaveAttribute(
      'title',
      'Markedly Structured Text',
    )
    await expect(abbreviation).toHaveCSS('text-decoration-line', 'none')
    await expect(abbreviation).toHaveCSS('cursor', 'help')
  })
})

test.describe('Not found', () => {
  test('unknown addresses get the 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')

    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'Page not found' }),
    ).toBeVisible()
  })

  test('the unpublished first post is gone', async ({ page }) => {
    const response = await page.goto('/posts/hello_web')

    expect(response?.status()).toBe(404)
  })
})
