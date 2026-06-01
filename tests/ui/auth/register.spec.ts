import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../../pages/RegisterPage';
import { TEST_PASSWORD } from '../../../fixtures/auth';
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
    await registerPage.register(uniqueUsername, uniqueEmail, TEST_PASSWORD);
    // On success, redirects to /login
    await registerPage.expectSuccessRedirect();
  });

  test('should show error for duplicate email', async ({ browser, request }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const uniqueUsername = `test_${Date.now()}`;

    // Pre-register via API first
    const res = await registerUser(request, {
      email: uniqueEmail,
      username: uniqueUsername,
      password: TEST_PASSWORD,
    });
    expect(res.status()).toBe(201);

    // Fresh context — no session cookie
    const context = await browser.newContext();
    const page = await context.newPage();
    const freshRegisterPage = new RegisterPage(page);

    try {
      await freshRegisterPage.goto();
      await expect(page).toHaveURL(/\/register/, { timeout: 5000 });

      // Submit with duplicate email — different username to avoid username conflict
      await freshRegisterPage.register(`other_${Date.now()}`, uniqueEmail, TEST_PASSWORD);

      // Wait for the submit button to leave loading state (disabled → enabled),
      // which means the API call has resolved (either error or redirect).
      await page.locator('button[type="submit"]:not([disabled])').waitFor({ timeout: 10000 });
      const currentUrl = page.url();

      if (currentUrl.includes('/register')) {
        // Stayed on register — check for error message
        const serverError = await page.locator('p.bg-red-50').count();
        expect(serverError).toBeGreaterThan(0);
      } else {
        // Redirected away — this means registration succeeded, which is a bug
        throw new Error(
          `Duplicate email registration should have failed but redirected to: ${currentUrl}`
        );
      }
    } finally {
      await context.close();
    }
  });

  test('should show error for invalid email format', async ({ page }) => {
    await registerPage.register('testuser', 'not-an-email', TEST_PASSWORD);
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
