const timeout = 5000
const url = 'http://localhost:3000'

describe(
  '/ (Home Page)',
  () => {
    let page

    beforeAll(async () => {
      page = await browser.newPage()
      await page.goto(url)
    }, timeout)

    afterAll(async () => {
      await page.close()
    })

    it('renders correctly', async () => {
      await expect(page).toMatch('Nicholas Rakotomihamina')
      const img = await page.screenshot()
      expect(img).toMatchImageSnapshot()
    })
  },
  timeout,
)

describe(
  '/posts/_post_style_guide',
  () => {
    let page

    beforeAll(async () => {
      page = await browser.newPage()
      await page.goto(`${url}/posts/_post_style_guide`)
    }, timeout)

    afterAll(async () => {
      await page.close()
    })

    it('renders correctly', async () => {
      await page.setViewport({ width: 800, height: 4800 })
      let title = await page.evaluate(
        () => document.querySelector('title').textContent,
      )
      expect(title).toEqual('Post Style Guide')
      const img = await page.screenshot()
      expect(img).toMatchImageSnapshot()
    })

    it('renders correctly on small screen', async () => {
      await page.setViewport({ width: 500, height: 5500 })
      let title = await page.evaluate(
        () => document.querySelector('title').textContent,
      )
      expect(title).toEqual('Post Style Guide')
      const img = await page.screenshot()
      expect(img).toMatchImageSnapshot()
    })
  },
  timeout,
)
