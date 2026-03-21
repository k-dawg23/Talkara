// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  // Standalone server uses HOST / PORT env; host: true → 0.0.0.0 (required for Railway, Docker, etc.)
  server: {
    host: true,
    port: 4321,
  },
  security: {
    checkOrigin: false
  },
  vite: {
    plugins: [tailwindcss()]
  }
});