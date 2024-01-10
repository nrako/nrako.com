import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import blogPlugin from '../fresh-blog-plugin/mod.ts'

export default defineConfig({
  plugins: [tailwind(), blogPlugin()],
});
