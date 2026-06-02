import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/bdd/**'],

  /* Run tests sequentially to avoid conflicts */
  fullyParallel: false,

  /* Fail fast on CI */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests */
  retries: process.env.CI ? 2 : 1,

  /* Reduce workers — 1 for CI, 2 for local */
  workers: process.env.CI ? 1 : 2,

  /* Timeout settings */
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  /* Reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['junit', { outputFile: 'results/junit.xml' }],
    ['./reporters/slack-reporter.ts'],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: true,
    }],
  ],

  use: {
    /* Base URL */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    extraHTTPHeaders: {
      'Accept': 'application/json',
    },

    /* Trace on first retry */
    trace: 'on-first-retry',

    /* Screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Video only on failure */
    video: 'retain-on-failure',

    /* Action timeout */
    actionTimeout: 10000,

    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: '**/setup/*.ts',
    },
    {
      name: 'API Tests',
      testMatch: '**/api/**/*.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'E2E Tests',
      testMatch: '**/e2e/**/*.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'UI Spec Tests',
      testMatch: '**/ui/**/*.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  /* Output folder for test artifacts */
  outputDir: 'test-results/',
});
