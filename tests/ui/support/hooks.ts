import { setDefaultTimeout, Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, request } from '@playwright/test';
import { CustomWorld } from './world';
import { BDD_CONFIG } from './config';

setDefaultTimeout(BDD_CONFIG.DEFAULT_TIMEOUT);

const ts = Date.now();
const TEST_EMAIL = `bdd_${ts}@test.com`;
const TEST_USERNAME = `bdduser_${ts}`;
const TEST_PASSWORD = BDD_CONFIG.TEST_PASSWORD;

export const BDD_USER = { email: TEST_EMAIL, password: TEST_PASSWORD };

BeforeAll(async function () {
  const context = await request.newContext();
  await context.post(`${BDD_CONFIG.API_URL}/auth/register`, {
    data: {
      email: TEST_EMAIL,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    },
  });
  await context.dispose();
  process.env.TEST_EMAIL = TEST_EMAIL;
  process.env.TEST_PASSWORD = TEST_PASSWORD;
  console.log(`BDD test user created: ${TEST_EMAIL}`);
});

AfterAll(async function () {
  console.log('BDD test suite complete');
});

Before(async function (this: CustomWorld) {
  const isHeaded = process.env.HEADLESS === 'false';
  this.browser = await chromium.launch({
    headless: !isHeaded,
    slowMo: isHeaded ? BDD_CONFIG.SLOW_MO : 0,
  });
  this.context = await this.browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  this.page = await this.context.newPage();
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === 'FAILED') {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
  }
  await this.page.close();
  await this.context.close();
  await this.browser.close();
});
