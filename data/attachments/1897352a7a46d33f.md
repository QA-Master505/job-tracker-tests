# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/auth/register.spec.ts >> Registration >> should show error for duplicate email
- Location: tests/ui/auth/register.spec.ts:30:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 201
Received: 404
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - link "JobTracker" [ref=e5] [cursor=pointer]:
      - /url: /
    - generic [ref=e6]:
      - link "Login" [ref=e7] [cursor=pointer]:
        - /url: /login
      - link "Register" [ref=e8] [cursor=pointer]:
        - /url: /register
  - main [ref=e9]:
    - generic [ref=e10]:
      - heading "Create Account" [level=2] [ref=e11]
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Username
          - textbox [ref=e15]
        - generic [ref=e16]:
          - generic [ref=e17]: Email
          - textbox [ref=e18]
        - generic [ref=e19]:
          - generic [ref=e20]: Password
          - textbox [ref=e21]
        - button "Register" [ref=e22] [cursor=pointer]
      - paragraph [ref=e23]:
        - text: Already have an account?
        - link "Log In" [ref=e24] [cursor=pointer]:
          - /url: /login
  - contentinfo [ref=e25]: © 2026 JobTracker. All rights reserved.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { RegisterPage } from '../../../pages/RegisterPage';
  3  | import { TEST_PASSWORD } from '../../../fixtures/auth';
  4  | import { registerUser } from '../../../helpers/api-helpers';
  5  | 
  6  | test.describe('Registration', () => {
  7  |   let registerPage: RegisterPage;
  8  | 
  9  |   test.beforeEach(async ({ page }) => {
  10 |     registerPage = new RegisterPage(page);
  11 |     await registerPage.goto();
  12 |   });
  13 | 
  14 |   test('should display the registration form', async ({ page }) => {
  15 |     await registerPage.expectRegisterPageVisible();
  16 |     await expect(page.locator('input[type="text"]')).toBeVisible();
  17 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  18 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  19 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  20 |   });
  21 | 
  22 |   test('should register a new user successfully', async () => {
  23 |     const uniqueEmail = `test-${Date.now()}@example.com`;
  24 |     const uniqueUsername = `test_${Date.now()}`;
  25 |     await registerPage.register(uniqueUsername, uniqueEmail, TEST_PASSWORD);
  26 |     // On success, redirects to /login
  27 |     await registerPage.expectSuccessRedirect();
  28 |   });
  29 | 
  30 |   test('should show error for duplicate email', async ({ browser, request }) => {
  31 |     const uniqueEmail = `test-${Date.now()}@example.com`;
  32 |     const uniqueUsername = `test_${Date.now()}`;
  33 | 
  34 |     // Pre-register via API first
  35 |     const res = await registerUser(request, {
  36 |       email: uniqueEmail,
  37 |       username: uniqueUsername,
  38 |       password: TEST_PASSWORD,
  39 |     });
> 40 |     expect(res.status()).toBe(201);
     |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  41 | 
  42 |     // Fresh context — no session cookie
  43 |     const context = await browser.newContext();
  44 |     const page = await context.newPage();
  45 |     const freshRegisterPage = new RegisterPage(page);
  46 | 
  47 |     try {
  48 |       await freshRegisterPage.goto();
  49 |       await expect(page).toHaveURL(/\/register/, { timeout: 15000 });
  50 | 
  51 |       // Submit with duplicate email — different username to avoid username conflict
  52 |       await freshRegisterPage.register(`other_${Date.now()}`, uniqueEmail, TEST_PASSWORD);
  53 | 
  54 |       // Wait for the submit button to leave loading state (disabled → enabled),
  55 |       // which means the API call has resolved (either error or redirect).
  56 |       await page.locator('button[type="submit"]:not([disabled])').waitFor({ timeout: 10000 });
  57 |       const currentUrl = page.url();
  58 | 
  59 |       if (currentUrl.includes('/register')) {
  60 |         // Stayed on register — check for error message
  61 |         const serverError = await page.locator('p.bg-red-50').count();
  62 |         expect(serverError).toBeGreaterThan(0);
  63 |       } else {
  64 |         // Redirected away — this means registration succeeded, which is a bug
  65 |         throw new Error(
  66 |           `Duplicate email registration should have failed but redirected to: ${currentUrl}`
  67 |         );
  68 |       }
  69 |     } finally {
  70 |       await context.close();
  71 |     }
  72 |   });
  73 | 
  74 |   test('should show error for invalid email format', async ({ page }) => {
  75 |     await registerPage.register('testuser', 'not-an-email', TEST_PASSWORD);
  76 |     // Browser native validation or server error should fire
  77 |     const nativeInvalid = await page.locator('input[type="email"]:invalid').count();
  78 |     const serverError = await page.locator('p.bg-red-50').count();
  79 |     expect(nativeInvalid > 0 || serverError > 0).toBeTruthy();
  80 |   });
  81 | 
  82 |   test('should show error when required fields are empty', async ({ page }) => {
  83 |     await page.click('button[type="submit"]');
  84 |     const nativeInvalid = await page.locator('input:invalid').count();
  85 |     const serverError = await page.locator('p.bg-red-50').count();
  86 |     expect(nativeInvalid > 0 || serverError > 0).toBeTruthy();
  87 |   });
  88 | });
  89 | 
```