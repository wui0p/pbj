import { defineConfig } from 'astro/config';
import inkTheme from './src/code-theme.mjs';

// GitHub Pages: the deploy workflow passes SITE_URL and BASE_PATH.
// For a user site (repo "wui0p.github.io") BASE_PATH is empty -> "/".
// For a project site (e.g. repo "blog") BASE_PATH is "/blog".
export default defineConfig({
  site: process.env.SITE_URL || 'https://wui0p.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: inkTheme,
      wrap: false,
      // let posts use ```systemverilog / ```sv as well as ```system-verilog
      langAlias: { systemverilog: 'system-verilog', sv: 'system-verilog', v: 'verilog' },
    },
  },
});
