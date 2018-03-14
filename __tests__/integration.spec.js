const timeout = 5000

describe('/ (Home Page)', () => {
  let page

  beforeAll(async () => {
    page = await global.__BROWSER__.newPage()
    await page.goto('http://localhost:3000')
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
}, timeout)
