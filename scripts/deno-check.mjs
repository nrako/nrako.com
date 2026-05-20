/**
 * Deno-native replacement for `astro check`.
 *
 * Background: invoking `astro check` through the Astro CLI exits 0 silently
 * under Deno — diagnostics never print and TS errors are not reported.
 * Calling `@astrojs/check`'s `check()` API directly works fine, so this
 * script bypasses the CLI machinery that triggers the Deno-specific quirk.
 */

import { check, parseArgsAsCheckConfig } from '@astrojs/check'
import process from 'node:process'

process.on('uncaughtException', (e) => {
  console.error('UNCAUGHT:', e)
  process.exit(2)
})
process.on('unhandledRejection', (e) => {
  console.error('UNHANDLED:', e)
  process.exit(3)
})

const args = parseArgsAsCheckConfig(process.argv.slice(2))

const result = await check(args)

if (typeof result === 'boolean') {
  process.exit(result ? 1 : 0)
}
