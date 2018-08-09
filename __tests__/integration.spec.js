const timeout = 5000
const url = 'http://localhost:3000'

describe(
  '/ (Home Page)',
  () => {
    let page

    beforeAll(async () => {
      page = await global.__BROWSER__.newPage()
      await page.goto(url)
    }, timeout)

    afterAll(async () => {
      await page.close()
    })

    it('renders correctly', async () => {
      let text = await page.evaluate(() => document.body.textContent)
      expect(text).toContain('Nicholas Rakotomihamina')
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
      page = await global.__BROWSER__.newPage()
      await page.goto(`${url}/posts/_post_style_guide`)
    }, timeout)

    afterAll(async () => {
      await page.close()
    })

    it('renders correctly', async () => {
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
