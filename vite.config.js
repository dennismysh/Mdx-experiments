import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { writeFileSync, readFileSync } from 'fs';

const isGHPages = process.env.GITHUB_PAGES === 'true';

// Plugin to copy index.html -> 404.html for SPA routing on GitHub Pages
function spa404Plugin() {
  return {
    name: 'spa-404',
    closeBundle() {
      if (isGHPages) {
        const indexPath = resolve('dist/index.html');
        const content = readFileSync(indexPath, 'utf-8');
        writeFileSync(resolve('dist/404.html'), content);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), spa404Plugin()],
  root: '.',
  base: isGHPages ? '/Mdx-experiments/' : '/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000',
      '/auth': 'http://localhost:4000',
    },
  },
});
