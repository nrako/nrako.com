import { expect, test, type Page } from '@playwright/test'

type PhasesWindow = Window & { phases: (string | null)[] }

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

  test('the sentence leaves as noise while the room for the stage opens', async ({
    page,
  }) => {
    // Slowed down: the opening lasts about half a second at its own pace
    await page.goto('/?speed=0.25')
    await page.waitForLoadState('networkidle')

    // The height at every frame until the stage comes, then with the stage
    const heights = page.evaluate(
      () =>
        new Promise<{ opening: number[]; playing: number }>((resolve) => {
          const intro = document.querySelector('.about-animation')!
          const opening: number[] = []
          const frame = () => {
            const { height } = intro.getBoundingClientRect()
            if (intro.getAttribute('data-phase') === 'playing') {
              resolve({ opening, playing: height })
              return
            }
            opening.push(height)
            requestAnimationFrame(frame)
          }
          frame()
        }),
    )

    await aboutMe(page).click()

    await expect(intro(page)).toHaveAttribute('data-phase', 'opening')
    const noise = intro(page).locator('.aa-noise')
    await expect(noise).toHaveText(/[░▒▓█▚▞<>/#_]/)
    await expect(noise).toHaveAttribute('aria-hidden', 'true')
    // In the red the link takes under the mouse, which is still on it
    const ink = await page.evaluate(() => getComputedStyle(document.body).color)
    const red = await aboutMe(page).evaluate(
      (link) => getComputedStyle(link).color,
    )
    expect(red).not.toBe(ink)
    await expect(noise).toHaveCSS('color', red)
    // Screen readers still have the sentence, and the stage is not there yet
    await expect(intro(page).locator('.aa-sentence')).toHaveText(sentence)
    await expect(intro(page).locator('.aa-stage')).toHaveCount(0)

    const { opening, playing } = await heights
    // It grows frame after frame, and has all its height when the stage comes
    expect(new Set(opening.map(Math.round)).size).toBeGreaterThan(5)
    for (const [index, height] of opening.entries()) {
      expect(height).toBeGreaterThanOrEqual((opening[index - 1] ?? 0) - 0.5)
    }
    expect(Math.abs(playing - opening[opening.length - 1])).toBeLessThan(1)
    await expect(noise).toHaveCount(0)
  })

  test('asked for again while it plays, it starts over without the noise', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const buffer = intro(page).locator('.aa-buffer')
    await aboutMe(page).click()
    await expect(buffer).toContainText('I was a Web')

    // Every phase it goes through from here on
    await page.evaluate(() => {
      const intro = document.querySelector('.about-animation')!
      const phases: (string | null)[] = []
      ;(window as PhasesWindow).phases = phases
      new MutationObserver(() => {
        phases.push(intro.getAttribute('data-phase'))
      }).observe(intro, { attributes: true, attributeFilter: ['data-phase'] })
    })

    await aboutMe(page).click()

    // The text is typed again from its first letter
    await expect(buffer).not.toContainText('Web')
    await expect(buffer).toContainText('I was a Web')
    expect(await page.evaluate(() => (window as PhasesWindow).phases)).toEqual(
      [],
    )
  })

  test('the link reads "About" and adds its words under the mouse', async ({
    page,
  }) => {
    await page.goto('/posts')

    const link = aboutMe(page)
    const words = link.locator('.about-suffix')
    await expect(link).toHaveText('About', { useInnerText: true })

    await link.hover()
    await expect(words).toHaveText('Me')
    await expect(words).toHaveText('Myself')
    await expect(words).toHaveText('I')

    await page.mouse.move(0, 400)
    await expect(link).toHaveText('About', { useInnerText: true })
  })

  test('the link reads "About..." while the introduction plays', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const link = aboutMe(page)
    await link.click()
    // Away from the link: its words are for a mouse resting on it
    await page.mouse.move(0, 400)

    await expect(link).toHaveText('About...', { useInnerText: true })

    await page.getByRole('button', { name: 'Skip' }).click()

    await expect(link).toHaveText('About', { useInnerText: true })
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

  test('on the board, Amin does not wait for the underline and both step aside', async ({
    page,
  }) => {
    await page.goto('/?from=board#about')

    // The board once the canvas is in `state`: who does what, how much of the
    // underline is left to draw (from 1 to 0), and how far to the right of
    // the underline's start Dave's cursor is
    const when = async (state: Record<string, string>) => {
      const board = await page.waitForFunction(
        (state) => {
          const canvas = document.querySelector<HTMLElement>('.aa-canvas')
          if (!canvas) return null
          for (const [name, value] of Object.entries(state)) {
            if (canvas.dataset[name] !== value) return null
          }
          const underline = canvas.querySelector('.aa-underline')!
          const pen = canvas.querySelector('.aa-dave .aa-pen')!
          return {
            dave: canvas.dataset.dave,
            note: canvas.dataset.note,
            toDraw: parseFloat(
              getComputedStyle(underline.querySelector('path')!)
                .strokeDashoffset,
            ),
            across:
              pen.getBoundingClientRect().left -
              underline.getBoundingClientRect().left,
          }
        },
        state,
        { polling: 'raf', timeout: 15_000 },
      )
      return board.jsonValue()
    }

    // Amin sets off for his word while Dave is still underlining
    const setOff = await when({ amin: 'fetch' })
    expect(setOff.dave).toBe('draw')
    expect(setOff.toDraw).toBeGreaterThan(0)

    // Dave steps aside once the underline is drawn, before the word is placed
    const aside = await when({ dave: 'away' })
    expect(aside.toDraw).toBeCloseTo(0, 1)
    expect(aside.note).toBe('held')

    // In the end the underline is still there, and Dave is beyond the
    // scribble it ends on, 148px across
    const end = await when({ amin: 'away', note: 'placed' })
    expect(end.dave).toBe('away')
    expect(end.toDraw).toBe(0)
    expect(end.across).toBeGreaterThan(200)
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

    test('goes to the stage without the noise', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Every phase it goes through until the stage is there
      const phases = page.evaluate(
        () =>
          new Promise<(string | null)[]>((resolve) => {
            const intro = document.querySelector('.about-animation')!
            const seen: (string | null)[] = []
            new MutationObserver(() => {
              const phase = intro.getAttribute('data-phase')
              seen.push(phase)
              if (phase === 'playing') resolve(seen)
            }).observe(intro, {
              attributes: true,
              attributeFilter: ['data-phase'],
            })
          }),
      )

      await aboutMe(page).click()

      expect(await phases).toEqual(['playing'])
    })
  })
})
