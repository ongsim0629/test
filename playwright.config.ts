import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    headless: false, // 디버깅 시 false
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure', // 추가
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cross-env TEST_ENV=e2e node server.js',
      port: 3000,
      timeout: 120000, // 추가
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe', // 로그 확인용
      stderr: 'pipe',
    },
    {
      command: 'pnpm dev',
      port: 5173,
      timeout: 120000, // 추가
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
