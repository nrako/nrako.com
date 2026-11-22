import { expect, test, type Locator, type Page } from '@playwright/test'

// The not-found page: a prose page that exists whatever is published
const PROSE_PAGE = '/this-page-does-not-exist'

async function openMenu(page: Page) {
  const button = page.getByRole('button', { name: 'Reading settings' })
  await expect(button).toBeEnabled({ timeout: 15000 })
  await button.click()
  const menu = page.locator('#reading-settings')
  await expect(menu).toBeVisible()
  return menu
}

// The radios are hidden behind their labels, which the reader clicks
async function choose(menu: Locator, name: string) {
  await menu.locator('label', { hasText: name }).click()
  await expect(menu.getByRole('radio', { name })).toBeChecked()
}

test.describe('Reading settings', () => {
  test('the menu opens under its button and closes with Escape', async ({
    page,
  }) => {
    await page.goto(PROSE_PAGE)
    const menu = await openMenu(page)

    const button = await page
      .getByRole('button', { name: 'Reading settings' })
      .boundingBox()
    const box = await menu.boundingBox()
    expect(box!.y).toBeGreaterThan(button!.y + button!.height)
    expect(
      Math.abs(box!.x + box!.width - (button!.x + button!.width)),
    ).toBeLessThan(2)

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
  })

  test('the typeface applies to the prose, not the header', async ({
    page,
  }) => {
    await page.goto(PROSE_PAGE)
    const menu = await openMenu(page)

    await choose(menu, 'Serif')

    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-reading-font', 'serif')
    await expect(page.locator('.prose')).toHaveCSS(
      'font-family',
      /Source Serif 4/,
    )
    await expect(page.locator('.site-header')).toHaveCSS(
      'font-family',
      /Fustat/,
    )

    // Back to the default: no attribute, nothing stored
    await choose(menu, 'Sans')
    await expect(html).not.toHaveAttribute('data-reading-font')
    expect(
      await page.evaluate(() => localStorage.getItem('reading-font')),
    ).toBeNull()
  })

  test('the size scales the text and the column', async ({ page }) => {
    await page.goto(PROSE_PAGE)
    const prose = page.locator('.prose')
    const before = await prose.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        size: parseFloat(style.fontSize),
        column: parseFloat(style.maxWidth),
      }
    })

    const menu = await openMenu(page)
    await choose(menu, 'Larger')
    await expect(page.locator('html')).toHaveAttribute(
      'data-reading-size',
      'large',
    )

    const after = await prose.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        size: parseFloat(style.fontSize),
        column: parseFloat(style.maxWidth),
      }
    })
    expect(after.size / before.size).toBeCloseTo(1.15, 2)
    expect(after.column / before.column).toBeCloseTo(1.15, 2)
  })

  test('the settings are set before render on the next page', async ({
    page,
  }) => {
    await page.goto(PROSE_PAGE)
    const menu = await openMenu(page)
    await choose(menu, 'Hyperlegible')
    await choose(menu, 'Smaller')

    // Recorded as the document is parsed, before any island hydrates
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const root = document.documentElement
        ;(window as unknown as { parsed: unknown }).parsed = {
          font: root.getAttribute('data-reading-font'),
          size: root.getAttribute('data-reading-size'),
        }
      })
    })
    await page.goto('/')

    expect(
      await page.evaluate(
        () => (window as unknown as { parsed: unknown }).parsed,
      ),
    ).toEqual({ font: 'hyperlegible', size: 'small' })
  })

  test('an unknown stored value is ignored', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('reading-font', 'comic')
    })
    await page.goto(PROSE_PAGE)

    await expect(page.locator('html')).not.toHaveAttribute('data-reading-font')
    const menu = await openMenu(page)
    await expect(menu.getByRole('radio', { name: 'Sans' })).toBeChecked()
  })
})
