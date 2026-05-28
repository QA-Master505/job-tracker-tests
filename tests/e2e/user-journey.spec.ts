import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { ProfilePage } from '../../pages/ProfilePage';

const BASE_URL = process.env.BASE_URL || 'https://job-tracker-frontend-green-sigma.vercel.app';
const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';

// Shared user for tests 2 and 3 — registered once in beforeAll
const TS = Date.now();
const SHARED_USER = {
  email: `e2e_user_${TS}@test.com`,
  username: `e2euser_${TS}`,
  password: 'Test123!',
};

let authToken = '';

test.describe('User Journey E2E', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API_URL}/auth/register`, { data: SHARED_USER });
    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: SHARED_USER.email, password: SHARED_USER.password }
    });
    const { access_token } = await res.json();
    authToken = access_token;
  });

  test('should register a new user and login successfully', async ({ page, request }) => {
    const ts = Date.now();
    const newUser = {
      email: `e2e_reg_${ts}@test.com`,
      username: `e2ereg_${ts}`,
      password: 'Test123!',
    };

    // Register via UI
    const registerPage = new RegisterPage(page);
    await page.goto(`${BASE_URL}/register`);
    await registerPage.register(newUser.username, newUser.email, newUser.password);

    // Verify redirect to login
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 15000 });

    // Login via UI
    const loginPage = new LoginPage(page);
    await loginPage.fillEmail(newUser.email);
    await loginPage.fillPassword(newUser.password);
    await loginPage.clickLogin();
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    // Verify via API — user can authenticate and exists
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: { email: newUser.email, password: newUser.password }
    });
    expect(loginRes.ok()).toBeTruthy();
    const { access_token } = await loginRes.json();

    const meRes = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    expect(meRes.ok()).toBeTruthy();
    const userData = await meRes.json();
    expect(userData.email).toBe(newUser.email);
  });

  test('should update user profile and verify via API', async ({ page, request }) => {
    const ts = Date.now();
    const newUsername = `e2eupdated_${ts}`;

    // Login via UI
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.fillEmail(SHARED_USER.email);
    await loginPage.fillPassword(SHARED_USER.password);
    await loginPage.clickLogin();
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Navigate to profile via nav link
    await page.getByTestId('nav-profile-link').click();
    await page.waitForURL(`${BASE_URL}/profile`, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Update username
    const profilePage = new ProfilePage(page);
    await profilePage.updateUsername(newUsername);
    await profilePage.saveProfile();

    // Verify success message
    await expect(page.getByTestId('profile-success-msg')).toBeVisible({ timeout: 10000 });

    // Verify via API
    const meRes = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(meRes.ok()).toBeTruthy();
    const userData = await meRes.json();
    expect(userData.username).toBe(newUsername);
  });

  test('should logout successfully and return to login page', async ({ page }) => {
    // Login via UI
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.fillEmail(SHARED_USER.email);
    await loginPage.fillPassword(SHARED_USER.password);
    await loginPage.clickLogin();
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Verify logged in - logout button visible
    await expect(page.getByTestId('logout-btn')).toBeVisible();

    // Logout via UI
    await page.getByTestId('logout-btn').click();

    // Verify redirected to login page
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);

    // Verify login form is visible again
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
