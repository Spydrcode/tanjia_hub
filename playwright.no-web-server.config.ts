import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 0,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
