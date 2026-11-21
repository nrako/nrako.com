import { expect, test, type Page } from '@playwright/test'

const sentence = 'I decide what is worth building. Opinions below.'

const intro = (page: Page) => page.locator('.about-animation')
const aboutMe = (page: Page) => page.getByRole('link', { name: 'About Me' })

test.describe('Introduction', () => {
  test('the homepage shows the sentence and does not play on its own', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.getByText(sentence)).toBeVisible()
    // Let the island start: it must still not play
    await page.waitForLoadState('networkidle')
    await expect(intro(page)).toHaveAttribute('data-phase', 'idle')
    await expect(intro(page).locator('.aa-stage')).toHaveCount(0)
  })

  test('"About Me" plays the introduction, "Skip" stops it', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await aboutMe(page).click()

    await expect(intro(page)).toHaveAttribute('data-phase', 'playing')
    await expect(intro(page).locator('.aa-stage')).toBeVisible()
    // The anchor stays out of the address: a reload does not replay
    expect(new URL(page.url()).hash).toBe('')

    await page.getByRole('button', { name: 'Skip' }).click()

    await expect(intro(page)).toHaveAttribute('data-phase', 'idle')
    await expect(intro(page).locator('.aa-stage')).toHaveCount(0)
    await expect(page.getByText(sentence)).toBeVisible()
  })

  test('plays through every scene and ends on the sentence', async ({
    page,
  }) => {
    // Sped up: the sequence lasts more than half a minute at its own pace
    await page.goto('/?speed=40')
    await page.waitForLoadState('networkidle')

    await aboutMe(page).click()
    await expect(intro(page)).toHaveAttribute('data-played', '')

    await expect(intro(page)).toHaveAttribute('data-phase', 'idle')
    await expect(page.getByText(sentence)).toBeVisible()

    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(overflows).toBe(false)
  })

  test('the stacks are listed where "Fullstack" goes, until it is typed', async ({
    page,
  }) => {
    await page.goto('/?from=fullstack&speed=4#about')

    // What is listed where the word goes, once the word typed there is
    // `typed`; resolves to null until then
    const stacksWhen = (typed: string) =>
      page.waitForFunction(
        (typed) => {
          const buffer = document.querySelector('.aa-buffer')
          const caret = buffer?.querySelector('.aa-caret')
          if (caret?.previousElementSibling?.textContent !== typed) return null
          const items = buffer?.querySelectorAll('.aa-anchor .aa-popup-item')
          return [...(items ?? [])].map((item) => item.textContent)
        },
        typed,
        { polling: 'raf', timeout: 15_000 },
      )

    // Before anything is typed, the list shows where the word starts
    const before = await (await stacksWhen('')).jsonValue()
    expect(before?.slice(0, 3)).toEqual(['TypeScript', 'Swift', '.NET C#'])

    // Once the word is typed, it is gone
    const after = await (await stacksWhen('Fullstack')).jsonValue()
    expect(after).toEqual([])
  })

  test('the list of past work shows three lines and scrolls to the last', async ({
    page,
  }) => {
    await page.goto('/?speed=4')
    await page.waitForLoadState('networkidle')

    await aboutMe(page).click()

    // Resolves once the last entry is selected and scrolled into view
    const list = await page.waitForFunction(
      () => {
        const selected = document.querySelector('.aa-popup-item[data-selected]')
        const frame = document.querySelector('.aa-popup-window')
        if (!selected || !frame) return null
        if (!selected.textContent?.startsWith('Electric Mobility')) return null

        const line = selected.getBoundingClientRect()
        const box = frame.getBoundingClientRect()
        if (line.top < box.top - 0.5 || line.bottom > box.bottom + 0.5) {
          return null
        }
        return {
          entries: frame.querySelectorAll('.aa-popup-item').length,
          linesShown: box.height / line.height,
        }
      },
      null,
      // The list comes a few seconds into the sequence, even sped up
      { polling: 'raf', timeout: 15_000 },
    )

    const { entries, linesShown } = await list.jsonValue()
    expect(entries).toBe(5)
    expect(linesShown).toBeCloseTo(3, 1)
  })

  test('"?from=" starts the sequence at that chapter', async ({ page }) => {
    await page.goto('/?from=prompt#about')

    // The prompt comes more than half a minute in when played from the start
    await expect(intro(page).locator('.aa-prompt')).toBeVisible()
    expect(new URL(page.url()).search).toBe('?from=prompt')
  })

  test('the transition filters the skills, then opens the file the ending writes', async ({
    page,
  }) => {
    await page.goto('/?from=now&speed=4#about')

    const stage = intro(page).locator('.aa-stage')
    // Each step lasts a fraction of a second: wait for it in the page
    const options = { polling: 'raf', timeout: 15_000 } as const
    const seen = (selector: string, text: string) =>
      page.waitForFunction(
        ([selector, text]) =>
          document.querySelector(selector)?.textContent?.includes(text),
        [selector, text],
        options,
      )
    // A count is the whole output: the second is a digit of the first
    const counted = (count: string) =>
      page.waitForFunction(
        (count) => document.querySelector('.aa-output')?.textContent === count,
        count,
        options,
      )

    // The titles in fashion are predicted after the caret, then turned down
    await seen('.aa-ghost', 'a Prompt Engineer, AI Whisperer aka Vibe Coder')
    await seen('.aa-refused', 'a Prompt Engineer, AI Whisperer aka Vibe Coder')
    await seen('.aa-status', ':!ls ~/skills | wc -l')
    await counted('360')
    await counted('3')
    await seen('.aa-status', '"now.md" [New]')
    // Out to a shell, where the agent is started
    await seen('.aa-status', ':sh')
    await seen('.aa-shell', 'agent')
    // The model says "pilot"; the author's verb is typed over it
    await seen('.aa-answer', 'pilot what is worth building')
    await seen('.aa-answer', 'I decide what is worth building')
    await seen('.aa-status', '"now.md" 1L, 49B written')

    await expect(stage).toHaveCount(0)
    await expect(page.getByText(sentence)).toBeVisible()
  })

  test('"About Me" on another page leads to the homepage and plays', async ({
    page,
  }) => {
    await page.goto('/this-page-does-not-exist')

    await aboutMe(page).click()

    await expect(intro(page)).toHaveAttribute('data-phase', 'playing')
    const url = new URL(page.url())
    expect(url.pathname).toBe('/')
    expect(url.hash).toBe('')
  })

  test('keeps the sentence available to screen readers while playing', async ({
    page,
  }) => {
    await page.goto('/#about')

    await expect(intro(page)).toHaveAttribute('data-phase', 'playing')
    await expect(intro(page).locator('.aa-sentence')).toHaveText(sentence)
    await expect(intro(page).locator('.aa-stage')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('still plays when asked to', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      await aboutMe(page).click()

      await expect(intro(page)).toHaveAttribute('data-phase', 'playing')
    })
  })
})
