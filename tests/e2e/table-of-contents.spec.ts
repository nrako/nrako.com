import { expect, test, type Locator, type Page } from '@playwright/test'
import { skipWithoutFixturePosts } from './fixtures'

// A window with a margin beside the column, and one without
const WIDE = { width: 1440, height: 900 }
const NARROW = { width: 390, height: 760 }

// The list: the title of the fixture post, then its sections
const SECTIONS = [
  'Fixture post',
  'A section',
  'Some math',
  'Some citations',
  'Some keys',
  'Some snippet',
  'Some code',
  'References',
]

const contents = (page: Page) =>
  page.getByRole('navigation', { name: 'Contents' })

async function box(locator: Locator) {
  const bounds = await locator.boundingBox()
  if (!bounds) throw new Error('the element has no box')
  return { ...bounds, bottom: bounds.y + bounds.height }
}

// Brings a heading to the top of the window, as following a link to it does
async function scrollTo(page: Page, id: string) {
  await page.evaluate((id) => document.getElementById(id)?.scrollIntoView(), id)
}

async function scrollToEnd(page: Page) {
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  )
}

test.describe('Table of contents', () => {
  test.beforeEach(() => {
    skipWithoutFixturePosts()
  })

  test('a post without sections has none', async ({ page }) => {
    await page.goto('/posts/fixture-short-post')

    await expect(page.locator('.post-content')).toBeVisible()
    await expect(contents(page)).toHaveCount(0)
  })

  test.describe('in a window with a margin', () => {
    test.use({ viewport: WIDE })

    test.beforeEach(async ({ page }) => {
      await page.goto('/posts/fixture-post')
    })

    test('the sections are listed beside the text', async ({ page }) => {
      const list = contents(page).getByRole('list').first()

      await expect(contents(page).getByRole('link')).toHaveText(SECTIONS)
      await expect(contents(page).locator('summary')).toBeHidden()

      const text = await box(page.locator('.post-content'))
      const beside = await box(list)
      expect(beside.x).toBeGreaterThan(text.x + text.width)
      expect(beside.x + beside.width).toBeLessThanOrEqual(WIDE.width)
    })

    test('the list follows the reader down the post', async ({ page }) => {
      await scrollTo(page, 'some-keys')

      await expect(
        contents(page).getByRole('link', { name: 'A section' }),
      ).toBeInViewport({ ratio: 1 })
    })

    test('the section being read is marked, and only that one', async ({
      page,
    }) => {
      const marked = contents(page).locator('[aria-current]')

      // A short section: the heading of the next one is under it in the window
      await scrollTo(page, 'some-keys')

      await expect(marked).toHaveText(['Some keys'])
      await expect(marked).toHaveAttribute('aria-current', 'location')
    })

    test('a section is marked once its heading is in the upper third of the window', async ({
      page,
    }) => {
      const marked = contents(page).locator('[aria-current]')
      const top = (id: string) =>
        page.evaluate(
          (id) => document.getElementById(id)!.getBoundingClientRect().top,
          id,
        )

      // Every section as tall as the window, whatever the fixture holds. A
      // browser scrolls by whole pixels: the heading is within two of the mark
      await page.addStyleTag({
        content: '.post-content h2 { margin-top: 100vh }',
      })

      // Its heading half-way down the window: the section before is read
      await page.evaluate((half) => {
        const heading = document.getElementById('some-citations')!
        window.scrollBy(0, heading.getBoundingClientRect().top - half)
      }, WIDE.height / 2)
      expect(
        Math.abs((await top('some-citations')) - WIDE.height / 2),
      ).toBeLessThan(2)
      await expect(marked).toHaveText(['Some math'])

      // A quarter of the way down: it is the one read
      await page.evaluate(
        (quarter) => window.scrollBy(0, quarter),
        WIDE.height / 4,
      )
      expect(
        Math.abs((await top('some-citations')) - WIDE.height / 4),
      ).toBeLessThan(2)
      await expect(marked).toHaveText(['Some citations'])
    })

    test('at the foot of the page, the last section is marked', async ({
      page,
    }) => {
      await scrollToEnd(page)

      await expect(contents(page).locator('[aria-current]')).toHaveText([
        'References',
      ])
    })

    test("the list starts with the post's title, which leads to the top of the page", async ({
      page,
    }) => {
      const marked = contents(page).locator('[aria-current]')
      const title = contents(page).getByRole('link', { name: 'Fixture post' })
      // The icon that says where the title leads, once the reader is not there
      const icon = title.locator('svg')
      await expect(marked).toHaveText(['Fixture post'])
      await expect(icon).toHaveCSS('opacity', '0')

      await scrollTo(page, 'some-keys')
      await expect(marked).toHaveText(['Some keys'])
      await expect(icon).toHaveCSS('opacity', '1')

      await title.click()

      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
      await expect(marked).toHaveText(['Fixture post'])
      await expect(icon).toHaveCSS('opacity', '0')
    })

    test('a section is reached from the list', async ({ page }) => {
      await contents(page).getByRole('link', { name: 'Some code' }).click()

      await expect(page).toHaveURL(/#some-code$/)
      await expect(
        page.getByRole('heading', { name: 'Some code' }),
      ).toBeInViewport()
    })
  })

  test.describe('in a window without a margin', () => {
    test.use({ viewport: NARROW })

    test.beforeEach(async ({ page }) => {
      await page.goto('/posts/fixture-post')
    })

    test('the list is closed, in a bar at the foot of the window', async ({
      page,
    }) => {
      await expect(contents(page).locator('summary')).toBeVisible()
      await expect(contents(page).getByRole('link').first()).toBeHidden()

      const bar = await box(contents(page))
      expect(bar.bottom).toBeCloseTo(NARROW.height, 0)
    })

    test('the bar names the section being read', async ({ page }) => {
      const summary = contents(page).locator('summary')
      await expect(summary).toHaveText('Contents Fixture post')

      await scrollTo(page, 'some-keys')

      await expect(summary).toHaveText('Contents Some keys')
      const bar = await box(contents(page))
      expect(bar.bottom).toBeCloseTo(NARROW.height, 0)
    })

    test('the bar opens the list over itself', async ({ page }) => {
      const summary = contents(page).locator('summary')
      await summary.click()

      await expect(contents(page).getByRole('link')).toHaveText(SECTIONS)
      const list = await box(contents(page).getByRole('list').first())
      const pressed = await box(summary)
      expect(list.bottom).toBeLessThanOrEqual(pressed.y + 1)
      expect(pressed.bottom).toBeCloseTo(NARROW.height, 0)
    })

    test('a section chosen is reached, and the list closes', async ({
      page,
    }) => {
      await contents(page).locator('summary').click()
      await contents(page).getByRole('link', { name: 'Some code' }).click()

      await expect(page).toHaveURL(/#some-code$/)
      await expect(
        page.getByRole('heading', { name: 'Some code' }),
      ).toBeInViewport()
      await expect(contents(page).getByRole('link').first()).toBeHidden()
    })

    test('a press outside the list closes it', async ({ page }) => {
      await contents(page).locator('summary').click()
      await expect(contents(page).getByRole('link').first()).toBeVisible()

      await page.getByRole('heading', { level: 1 }).click()

      await expect(contents(page).getByRole('link').first()).toBeHidden()
    })

    test('Escape closes the list', async ({ page }) => {
      await contents(page).locator('summary').click()
      await expect(contents(page).getByRole('link').first()).toBeVisible()

      await page.keyboard.press('Escape')

      await expect(contents(page).getByRole('link').first()).toBeHidden()
    })

    test('the bar stops where the post does', async ({ page }) => {
      await scrollToEnd(page)

      const bar = await box(contents(page))
      const text = await box(page.locator('.post-body'))
      expect(bar.bottom).toBeLessThanOrEqual(text.bottom + 1)
      expect(bar.bottom).toBeLessThan(NARROW.height - 1)
    })
  })

  test.describe('of a post that has reactions', () => {
    test.beforeEach(async ({ page }) => {
      // The fixture names a Bluesky post that does not exist
      await page.route('https://public.api.bsky.app/**', (route) =>
        route.abort(),
      )
    })

    test('the list ends with a link to the reactions', async ({ page }) => {
      await page.setViewportSize(WIDE)
      await page.goto('/posts/fixture-reactions-post')

      await expect(contents(page).getByRole('link')).toHaveText([
        'Fixture reactions post',
        'A first section',
        'A second section',
        'Reactions',
      ])

      await contents(page)
        .getByRole('link', { name: 'Reactions', exact: true })
        .click()

      await expect(page).toHaveURL(/#reactions$/)
    })

    test('a post without reactions has no such link', async ({ page }) => {
      await page.setViewportSize(WIDE)
      await page.goto('/posts/fixture-post')

      await expect(contents(page).getByRole('link').first()).toBeVisible()
      await expect(
        contents(page).getByRole('link', { name: 'Reactions', exact: true }),
      ).toHaveCount(0)
    })

    test('the bar follows the reader past the reactions', async ({ page }) => {
      await page.setViewportSize(NARROW)
      await page.goto('/posts/fixture-reactions-post')

      // The reactions come and go as they load, and the page's end with them:
      // both are measured at once, from the end as it then is
      await expect(async () => {
        await scrollToEnd(page)
        const { bar, reactions } = await page.evaluate(() => ({
          bar: document.querySelector('.post-contents')!.getBoundingClientRect()
            .top,
          reactions: document
            .querySelector('#reactions')!
            .getBoundingClientRect().bottom,
        }))
        expect(bar).toBeGreaterThanOrEqual(reactions)
      }).toPass()
      await expect(contents(page).locator('summary')).toHaveText(
        'Contents Reactions',
      )
    })
  })
})
