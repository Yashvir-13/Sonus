import fs from 'node:fs'
import { defineConfig } from '@playwright/test'

const CONTAINER_CHROMIUM_PATH =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell'

const executablePath = fs.existsSync(CONTAINER_CHROMIUM_PATH)
  ? CONTAINER_CHROMIUM_PATH
  : undefined

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: 'pnpm --prefix apps/web preview --port 5173 --host 127.0.0.1',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
