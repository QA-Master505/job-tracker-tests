import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../../pages/RegisterPage';
import { testUser } from '../../../fixtures/test-data';
import { registerUser } from '../../../helpers/api-helpers';

test.describe('Registration', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('should display the registration form', async ({ page }) => {
    await registerPage.expectRegisterPageVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register a new user successfully', async () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const uniqueUsername = `test_${Date.now()}`;
    await registerPage.register(uniqueUsername, uniqueEmail, testUser.password);
    // On success, redirects to /login
    await registerPage.expectSuccessRedirect();
  });

  test('should show error for duplicate email', async ({ request }) => {
    // Pre-register a user via API so the duplicate is guaranteed to exist
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const uniqueUsername = `test_${Date.now()}`;
    await registerUser(request, { email: uniqueEmail, username: uniqueUsername, password: testUser.password });

    // Try to register again via UI with the same email
    await registerPage.register(`${uniqueUsername}_2`, uniqueEmail, testUser.password);
    const error = await registerPage.getErrorMessage();
    expect(error).toBeTruthy();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await registerPage.register('testuser', 'not-an-email', testUser.password);
    // Browser native validation or server error should fire
    const nativeInvalid = await page.locator('input[type="email"]:invalid').count();
    const serverError = await page.locator('p.bg-red-50').count();
    expect(nativeInvalid > 0 || serverError > 0).toBeTruthy();
  });

  test('should show error when required fields are empty', async ({ page }) => {
    await page.click('button[type="submit"]');
    const nativeInvalid = await page.locator('input:invalid').count();
    const serverError = await page.locator('p.bg-red-50').count();
    expect(nativeInvalid > 0 || serverError > 0).toBeTruthy();
  });
});
