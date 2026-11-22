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
    await choose(menu, 'Heavier')

    // Recorded as the document is parsed, before any island hydrates
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const root = document.documentElement
        ;(window as unknown as { parsed: unknown }).parsed = {
          font: root.getAttribute('data-reading-font'),
          size: root.getAttribute('data-reading-size'),
          weight: root.getAttribute('data-reading-weight'),
        }
      })
    })
    await page.goto('/')

    expect(
      await page.evaluate(
        () => (window as unknown as { parsed: unknown }).parsed,
      ),
    ).toEqual({ font: 'hyperlegible', size: 'small', weight: 'heavy' })
  })

  test('the weight moves every weight, on top of the theme', async ({
    page,
  }) => {
    const weights = () =>
      page.evaluate(() => {
        const weight = (selector: string) =>
          Number(getComputedStyle(document.querySelector(selector)!).fontWeight)
        return { text: weight('.prose p'), title: weight('.prose h1') }
      })

    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(PROSE_PAGE)
    const menu = await openMenu(page)
    await choose(menu, 'Heavier')
    await expect(page.locator('html')).toHaveAttribute(
      'data-reading-weight',
      'heavy',
    )
    expect(await weights()).toEqual({ text: 550, title: 450 })

    await choose(menu, 'Lighter')
    expect(await weights()).toEqual({ text: 300, title: 200 })

    // Dark mode's -25 adds to the reader's step
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto(PROSE_PAGE)
    await expect(page.locator('html')).toHaveClass(/dark/)
    expect(await weights()).toEqual({ text: 275, title: 175 })
  })

  test('the soft background softens the ground and the ink in both themes', async ({
    page,
  }) => {
    const colours = () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.body)
        return { ground: style.backgroundColor, ink: style.color }
      })

    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(PROSE_PAGE)
    expect(await colours()).toEqual({
      ground: 'rgb(255, 255, 255)',
      ink: 'rgb(0, 0, 0)',
    })

    const menu = await openMenu(page)
    await choose(menu, 'Soft')
    await expect(page.locator('html')).toHaveAttribute(
      'data-reading-background',
      'soft',
    )
    expect(await colours()).toEqual({
      ground: 'rgb(251, 250, 247)',
      ink: 'rgb(38, 38, 38)',
    })

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto(PROSE_PAGE)
    await expect(page.locator('html')).toHaveClass(/dark/)
    expect(await colours()).toEqual({
      ground: 'rgb(26, 26, 26)',
      ink: 'rgb(214, 214, 214)',
    })
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
