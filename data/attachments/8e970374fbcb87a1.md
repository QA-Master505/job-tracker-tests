# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/user-journey.spec.ts >> User Journey E2E >> should register a new user and login successfully
- Location: tests/e2e/user-journey.spec.ts:36:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "https://job-tracker-frontend-green-sigma.vercel.app/login" until "load"
============================================================
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { LoginPage } from '../../pages/LoginPage';
  3   | import { RegisterPage } from '../../pages/RegisterPage';
  4   | import { ProfilePage } from '../../pages/ProfilePage';
  5   | import { deleteTestUser } from '../../fixtures/auth';
  6   | 
  7   | const BASE_URL = process.env.BASE_URL || 'https://job-tracker-frontend-green-sigma.vercel.app';
  8   | const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';
  9   | 
  10  | // Shared user for tests 2 and 3 — registered once in beforeAll
  11  | const TS = Date.now();
  12  | const SHARED_USER = {
  13  |   email: `e2e_user_${TS}@test.com`,
  14  |   username: `e2euser_${TS}`,
  15  |   password: 'Test123!',
  16  | };
  17  | 
  18  | let authToken = '';
  19  | let ephemeralUser: { email: string; password: string } | null = null;
  20  | 
  21  | test.describe('User Journey E2E', () => {
  22  |   test.beforeAll(async ({ request }) => {
  23  |     await request.post(`${API_URL}/auth/register`, { data: SHARED_USER });
  24  |     const res = await request.post(`${API_URL}/auth/login`, {
  25  |       data: { email: SHARED_USER.email, password: SHARED_USER.password }
  26  |     });
  27  |     const { access_token } = await res.json();
  28  |     authToken = access_token;
  29  |   });
  30  | 
  31  |   test.afterAll(async ({ request }) => {
  32  |     if (ephemeralUser) await deleteTestUser(request, ephemeralUser.email, ephemeralUser.password);
  33  |     await deleteTestUser(request, SHARED_USER.email, SHARED_USER.password);
  34  |   });
  35  | 
  36  |   test('should register a new user and login successfully', async ({ page, request }) => {
  37  |     const ts = Date.now();
  38  |     const newUser = {
  39  |       email: `e2e_reg_${ts}@test.com`,
  40  |       username: `e2ereg_${ts}`,
  41  |       password: 'Test123!',
  42  |     };
  43  |     ephemeralUser = { email: newUser.email, password: newUser.password };
  44  | 
  45  |     // Register via UI
  46  |     const registerPage = new RegisterPage(page);
  47  |     await page.goto(`${BASE_URL}/register`);
  48  |     await registerPage.register(newUser.username, newUser.email, newUser.password);
  49  | 
  50  |     // Verify redirect to login
> 51  |     await page.waitForURL(`${BASE_URL}/login`, { timeout: 15000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  52  | 
  53  |     // Login via UI
  54  |     const loginPage = new LoginPage(page);
  55  |     await loginPage.fillEmail(newUser.email);
  56  |     await loginPage.fillPassword(newUser.password);
  57  |     await loginPage.clickLogin();
  58  |     await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20000 });
  59  |     await page.waitForLoadState('networkidle');
  60  |     await expect(page.locator('body')).toBeVisible();
  61  | 
  62  |     // Verify via API — user can authenticate and exists
  63  |     const loginRes = await request.post(`${API_URL}/auth/login`, {
  64  |       data: { email: newUser.email, password: newUser.password }
  65  |     });
  66  |     expect(loginRes.ok()).toBeTruthy();
  67  |     const { access_token } = await loginRes.json();
  68  | 
  69  |     const meRes = await request.get(`${API_URL}/users/me`, {
  70  |       headers: { Authorization: `Bearer ${access_token}` }
  71  |     });
  72  |     expect(meRes.ok()).toBeTruthy();
  73  |     const userData = await meRes.json();
  74  |     expect(userData.email).toBe(newUser.email);
  75  |   });
  76  | 
  77  |   test('should update user profile and verify via API', async ({ page, request }) => {
  78  |     const ts = Date.now();
  79  |     const newUsername = `e2eupdated_${ts}`;
  80  | 
  81  |     // Login via UI
  82  |     const loginPage = new LoginPage(page);
  83  |     await loginPage.navigate();
  84  |     await loginPage.fillEmail(SHARED_USER.email);
  85  |     await loginPage.fillPassword(SHARED_USER.password);
  86  |     await loginPage.clickLogin();
  87  |     await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20000 });
  88  |     await page.waitForLoadState('networkidle');
  89  | 
  90  |     // Navigate to profile via nav link
  91  |     await page.getByTestId('nav-profile-link').click();
  92  |     await page.waitForURL(`${BASE_URL}/profile`, { timeout: 10000 });
  93  |     await page.waitForLoadState('networkidle');
  94  | 
  95  |     // Update username
  96  |     const profilePage = new ProfilePage(page);
  97  |     await profilePage.updateUsername(newUsername);
  98  |     await profilePage.saveProfile();
  99  | 
  100 |     // Verify success message
  101 |     await expect(page.getByTestId('profile-success-msg')).toBeVisible({ timeout: 10000 });
  102 | 
  103 |     // Verify via API
  104 |     const meRes = await request.get(`${API_URL}/users/me`, {
  105 |       headers: { Authorization: `Bearer ${authToken}` }
  106 |     });
  107 |     expect(meRes.ok()).toBeTruthy();
  108 |     const userData = await meRes.json();
  109 |     expect(userData.username).toBe(newUsername);
  110 |   });
  111 | 
  112 |   test('should logout successfully and return to login page', async ({ page }) => {
  113 |     // Login via UI
  114 |     const loginPage = new LoginPage(page);
  115 |     await loginPage.navigate();
  116 |     await loginPage.fillEmail(SHARED_USER.email);
  117 |     await loginPage.fillPassword(SHARED_USER.password);
  118 |     await loginPage.clickLogin();
  119 |     await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20000 });
  120 |     await page.waitForLoadState('networkidle');
  121 | 
  122 |     // Verify logged in - logout button visible
  123 |     await expect(page.getByTestId('logout-btn')).toBeVisible();
  124 | 
  125 |     // Logout via UI
  126 |     await page.getByTestId('logout-btn').click();
  127 | 
  128 |     // Verify redirected to login page
  129 |     await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });
  130 |     await expect(page).toHaveURL(/\/login/);
  131 | 
  132 |     // Verify login form is visible again
  133 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  134 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  135 |   });
  136 | });
  137 | 
```