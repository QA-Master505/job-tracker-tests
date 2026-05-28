import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { BDD_CONFIG } from '../support/config';

When('I navigate to profile settings', async function (this: CustomWorld) {
  await this.page.getByTestId('nav-profile-link').click();
  await this.page.waitForLoadState('networkidle');
});

When('I update my username to {string}', async function (this: CustomWorld, username: string) {
  const uniqueUsername = `${username}_${Date.now()}`;
  const usernameInput = this.page.getByTestId('profile-username-input');
  await usernameInput.clear();
  await usernameInput.fill(uniqueUsername);
});

Then('my username should be updated successfully', async function (this: CustomWorld) {
  await this.page.getByTestId('save-username-btn').click();
  await expect(this.page.getByTestId('profile-success-msg')).toBeVisible({ timeout: BDD_CONFIG.DEFAULT_TIMEOUT });
});

When('I update my email to {string}', async function (this: CustomWorld, _email: string) {
  const uniqueEmail = `bdd_email_${Date.now()}@test.com`;
  const emailInput = this.page.getByTestId('profile-email-input');
  await emailInput.clear();
  await emailInput.fill(uniqueEmail);
});

Then('my email should be updated successfully', async function (this: CustomWorld) {
  await this.page.getByTestId('save-email-btn').click();
  await expect(this.page.getByTestId('profile-success-msg')).toBeVisible({ timeout: BDD_CONFIG.DEFAULT_TIMEOUT });
});
