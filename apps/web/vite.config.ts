import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const repositoryRoot = decodeURIComponent(new URL('../..', import.meta.url).pathname)
  .replace(/^\/([A-Za-z]:\/)/, '$1');

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    fs: {
      allow: [repositoryRoot],
    },
  },
});
