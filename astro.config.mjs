// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()]
  }
});
