import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { ProfilePage } from '../../../pages/ProfilePage';
import { createTestUser, TestUser } from '../../../fixtures/auth';

test.describe('Profile', () => {
  let profilePage: ProfilePage;
  let testUser: TestUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('should display the profile page', async () => {
    await profilePage.expectVisible();
  });

  test('should display current user information in Account Details', async ({ page }) => {
    // Account Details uses <dd> plain text, not inputs — check by visible text
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible();
  });

  test('should update username successfully', async ({ page }) => {
    const newUsername = `playwright_${Date.now()}`;
    await profilePage.updateUsername(newUsername);
    await profilePage.saveProfile(); // submits the Change Username form
    await expect(page.getByTestId('profile-success-msg')).toBeVisible({ timeout: 10000 });
    const msg = await profilePage.getSuccessMessage();
    expect(msg).toBeTruthy();
  });

  test('should show browser validation for invalid email on profile update', async ({ page }) => {
    await profilePage.updateEmail('not-a-valid-email');
    await profilePage.saveEmailSection(); // submits the Change Email form
    // HTML5 browser validation fires before submission for invalid email
    const nativeInvalid = await page.locator('input[type="email"]:invalid').count();
    const serverError = await page.locator('p.text-red-700').count();
    expect(nativeInvalid > 0 || serverError > 0).toBeTruthy();
  });
});
