import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    // CRA's default. Kept so bookmarks and muscle memory still work.
    port: 3000,
    open: false,
  },

  preview: {
    port: 3001,
  },

  build: {
    // Vite's own default is `dist`. Overridden to `build` so .gitignore, any
    // deploy config, and `serve -s build` keep working unchanged.
    outDir: 'build',
    sourcemap: true,
  },
});
