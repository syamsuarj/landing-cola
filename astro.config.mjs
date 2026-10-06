// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// inlineStylesheets: CSS (~13 KB gzip) di-inline agar tidak render-blocking → LCP mobile lebih cepat.
export default defineConfig({
  build: { inlineStylesheets: 'always' },
});
