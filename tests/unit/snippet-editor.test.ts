import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decompress } from 'livecodes'
import { playgroundAddress, scriptError } from '../../src/lib/snippetEditor.ts'

const sources = [
  { language: 'html', code: '<p>Seen.</p>' },
  { language: 'svg', code: '<svg width="1"></svg>' },
  { language: 'css', code: 'p { color: red; }' },
  { language: 'js', code: 'let a = 1' },
  { language: 'ts', code: 'const shown: string = "and not run"' },
]

function configOf(address: URL) {
  const config = new URLSearchParams(address.hash.slice(1)).get('config')
  assert.ok(config?.startsWith('code/'))
  return JSON.parse(decompress(config.slice('code/'.length)) ?? '')
}

test('the playground opens with the parts of the demo, as the demo takes them', () => {
  const address = new URL(playgroundAddress(sources, { title: 'A snippet' }))

  assert.equal(address.origin, 'https://livecodes.io')
  const { markup, style, script, tools } = configOf(address)
  // The playground's tools are left as it sets them
  assert.equal(tools, undefined)
  // The markup is the HTML and the drawings together; what is not run is left
  assert.deepEqual(markup, {
    language: 'html',
    content: '<p>Seen.</p>\n<svg width="1"></svg>',
  })
  assert.deepEqual(style, { language: 'css', content: 'p { color: red; }' })
  assert.deepEqual(script, { language: 'javascript', content: 'let a = 1' })
})

test('the playground of a snippet with a console opens with its console', () => {
  const address = new URL(playgroundAddress(sources, { console: true }))

  assert.deepEqual(configOf(address).tools, {
    active: 'console',
    status: 'open',
  })
  // Asked for in the fragment, as the sources are
  assert.equal(address.search, '')
})

test('the sources are in the fragment of the address, which is not sent', () => {
  const address = new URL(playgroundAddress(sources, { title: 'A snippet' }))

  // Only the title, which the page already shows, is in what a server sees
  assert.deepEqual([...address.searchParams.keys()], ['title'])
  assert.equal(address.searchParams.get('title'), 'A snippet')
  assert.ok(!address.search.includes('Seen'))
  assert.equal(configOf(address).title, 'A snippet')
})

test('a playground without a title sends nothing to the server', () => {
  const address = new URL(playgroundAddress(sources))

  assert.equal(address.search, '')
  assert.equal(address.pathname, '/')
})

test('a script that parses has no error', () => {
  assert.equal(scriptError(''), undefined)
  assert.equal(scriptError('let count = 0\ncount += 1'), undefined)
  // As in a module, `await` stands at the top
  assert.equal(scriptError('const value = await Promise.resolve(1)'), undefined)
})

test('a script that does not parse gives the reason', () => {
  assert.equal(typeof scriptError('let = ;'), 'string')
  assert.equal(typeof scriptError('function unfinished() {'), 'string')
})

test('a script is parsed without being run', () => {
  assert.equal(scriptError('throw new Error("run")'), undefined)
})

test('a script that imports or exports is taken as it is', () => {
  // Not the body of a function: only running it would say whether it parses
  assert.equal(scriptError('import { a } from "./a.js"\nlet = ;'), undefined)
  assert.equal(scriptError('export const a = 1'), undefined)
})
