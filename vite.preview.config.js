import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Everything is embedded before encryption. No public model, JS or CSS files.
export default defineConfig({
  plugins: [viteSingleFile()],
  publicDir: false,
  build: { outDir: '.preview/plain', sourcemap: false },
});
