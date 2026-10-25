import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './preview-tests',
  timeout: 60000,
  use: {
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
    viewport: { width: 1280, height: 900 },
  },
});
