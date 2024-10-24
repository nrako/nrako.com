#!/usr/bin/env -S deno run -A --watch=static/,routes/
import { tailwind } from '@fresh/plugin-tailwind'

import { Builder } from 'fresh/dev'
import { app } from './main.ts'

Deno.env.set('ENV', 'development')

const builder = new Builder()
tailwind(builder, app, {})
if (Deno.args.includes('build')) {
  await builder.build(app)
} else {
  await builder.listen(app)
}
