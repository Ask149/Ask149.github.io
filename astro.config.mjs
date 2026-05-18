import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
// Note: @astrojs/sitemap will be re-enabled in Phase C once multi-page content lands.
export default defineConfig({
  site: 'https://Ask149.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'never',
  integrations: [mdx(), react(), tailwind()],
  build: {
    format: 'directory',
  },
})