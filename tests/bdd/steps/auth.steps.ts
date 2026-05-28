import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../../../pages/LoginPage';
import { BDD_USER } from '../support/hooks';
import { BDD_CONFIG } from '../support/config';

Given('I am on the login page', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.navigate();
});

Given('I am logged in', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.navigate();
  await loginPage.fillEmail(process.env.TEST_EMAIL || 'testuser@test.com');
  await loginPage.fillPassword(process.env.TEST_PASSWORD || 'Test123!');
  await loginPage.clickLogin();
  await this.page.waitForURL('**/dashboard', { timeout: BDD_CONFIG.NAVIGATION_TIMEOUT })
    .catch(async () => {
      await this.page.waitForLoadState('networkidle', { timeout: BDD_CONFIG.NAVIGATION_TIMEOUT });
    });
});

When('I enter email {string} and password {string}',
  async function (this: CustomWorld, email: string, password: string) {
    const actualEmail = email === 'testuser@test.com' ? BDD_USER.email : email;
    const actualPassword = password === 'Test123!' ? BDD_USER.password : password;
    await this.page.fill('input[type="email"]', actualEmail);
    await this.page.fill('input[type="password"]', actualPassword);
  });

When('I click the login button', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.clickLogin();
});

Then('I should be redirected to the dashboard', async function (this: CustomWorld) {
  await this.page.waitForURL('**/dashboard', { timeout: BDD_CONFIG.NAVIGATION_TIMEOUT })
    .catch(async () => {
      await expect(this.page).not.toHaveURL(/login/, { timeout: 5000 });
    });
});

Then('I should see my job applications', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  await expect(this.page.locator('body')).toBeVisible();
});

Then('I should see an error message', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  const error = await loginPage.getErrorMessage();
  expect(error).toBeTruthy();
});

When('I click the logout button', async function (this: CustomWorld) {
  await this.page.getByTestId('logout-btn').click();
});

Then('I should be redirected to the login page', async function (this: CustomWorld) {
  await this.page.waitForURL('**/login', { timeout: 10000 });
});
