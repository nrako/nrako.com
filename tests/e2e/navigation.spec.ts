import { expect, test, type Page } from '@playwright/test'
import { usesFixturePosts } from './fixtures'

// Where the header and the footer sit against the content column between
// them, in pixels
function againstColumn(page: Page) {
  return page.evaluate(() => {
    const box = (selector: string) => {
      const element = document.querySelector(selector)
      if (!element) throw new Error(`nothing matches ${selector}`)
      return element.getBoundingClientRect()
    }
    const column = box('main > :first-child')
    const plate = box('.home-plate')
    const icons = [...document.querySelectorAll('.site-header svg')]
      .map((icon) => icon.getBoundingClientRect())
      .filter((icon) => icon.width > 0)
    return {
      columnWidth: column.width,
      // The home plate's tip is at its middle
      tipFromLeftEdge: plate.left + plate.width / 2 - column.left,
      lastIconFromRightEdge:
        Math.max(...icons.map((icon) => icon.right)) - column.right,
      iconMiddles: icons.map((icon) => (icon.top + icon.bottom) / 2),
      footerFromLeftEdge: box('footer .freshBlog-footer').left - column.left,
      footerFromRightEdge: box('footer > div > a').right - column.right,
    }
  })
}

test.describe('Navigation', () => {
  test('header contains main navigation links', async ({ page }) => {
    await page.goto('/')

    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'Home Base' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Blog' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'About Me' })).toBeVisible()
  })

  test('the header fits on one line on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const boxes = await page
      .getByRole('banner')
      .getByRole('link')
      .evaluateAll((links) =>
        links.map((link) => {
          const box = link.getBoundingClientRect()
          return { right: box.right, height: box.height }
        }),
      )

    // No link is pushed out of the viewport and no label wraps
    for (const box of boxes) {
      expect(box.right).toBeLessThanOrEqual(375)
      expect(box.height).toBeLessThan(45)
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(375)
  })

  test('the header and the footer sit on the content column of every page', async ({
    page,
  }) => {
    const pages = ['/', '/posts', '/this-page-does-not-exist']
    if (usesFixturePosts) pages.push('/posts/fixture-post')

    const widths = []
    for (const url of pages) {
      await page.goto(url)
      const edges = await againstColumn(page)

      // The home plate points at the column's left edge, and the last icon
      // ends on its right one
      expect(Math.abs(edges.tipFromLeftEdge), url).toBeLessThan(1)
      expect(Math.abs(edges.lastIconFromRightEdge), url).toBeLessThan(1)
      // Every icon is centred on the same line
      for (const middle of edges.iconMiddles) {
        expect(Math.abs(middle - edges.iconMiddles[0]), url).toBeLessThan(1)
      }
      // The footer starts and ends on the column's edges
      expect(Math.abs(edges.footerFromLeftEdge), url).toBeLessThan(1)
      expect(Math.abs(edges.footerFromRightEdge), url).toBeLessThan(1)
      widths.push(edges.columnWidth)
    }

    // The column does not change width from one page to the next
    for (const width of widths) {
      expect(Math.abs(width - widths[0])).toBeLessThan(1)
    }
  })

  test('navigates to posts page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Blog' }).click()

    await expect(page).toHaveURL('/posts')
  })

  test('home link returns to homepage', async ({ page }) => {
    await page.goto('/posts')

    await page.getByRole('link', { name: 'Home Base' }).click()

    await expect(page).toHaveURL('/')
  })

  test('social links have correct destinations', async ({ page }) => {
    await page.goto('/')

    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'Social' })).toHaveAttribute(
      'href',
      'https://bsky.app/profile/nrako.com',
    )

    await expect(header.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/nrako',
    )
  })

  test('footer contains feed links', async ({ page }) => {
    await page.goto('/')

    const footer = page.getByRole('contentinfo')

    await expect(footer.getByRole('link', { name: 'Atom' })).toHaveAttribute(
      'href',
      '/feed/atom',
    )
    await expect(footer.getByRole('link', { name: 'JSON' })).toHaveAttribute(
      'href',
      '/feed/json',
    )
    await expect(footer.getByRole('link', { name: 'RSS' })).toHaveAttribute(
      'href',
      '/feed/rss',
    )
  })

  test('footer contains source link', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'Source' }),
    ).toHaveAttribute('href', 'https://github.com/nrako/nrako.com')
  })
})
