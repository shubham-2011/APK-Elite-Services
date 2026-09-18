import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: 'mobile-viewport',
      use: {
        ...devices['Pixel 7']
      }
    }
  ]
});
