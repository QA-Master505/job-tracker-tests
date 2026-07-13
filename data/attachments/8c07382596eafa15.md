# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/job-journey.spec.ts >> Job Journey E2E >> should update job status via UI and verify via API
- Location: tests/e2e/job-journey.spec.ts:77:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation to "https://job-tracker-frontend-green-sigma.vercel.app/dashboard" until "load"
============================================================
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { LoginPage } from '../../pages/LoginPage';
  3   | import { deleteTestUser } from '../../fixtures/auth';
  4   | 
  5   | const BASE_URL = process.env.BASE_URL || 'https://job-tracker-frontend-green-sigma.vercel.app';
  6   | const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';
  7   | 
  8   | // Shared user for all tests - created once
  9   | const SHARED_USER = {
  10  |   email: `e2e_${Date.now()}@test.com`,
  11  |   username: `e2euser_${Date.now()}`,
  12  |   password: 'Test123!',
  13  | };
  14  | 
  15  | let authToken = '';
  16  | 
  17  | test.describe('Job Journey E2E', () => {
  18  | 
  19  |   test.beforeAll(async ({ request }) => {
  20  |     // Register user
  21  |     await request.post(`${API_URL}/auth/register`, { data: SHARED_USER });
  22  |     // Get token
  23  |     const res = await request.post(`${API_URL}/auth/login`, {
  24  |       data: { email: SHARED_USER.email, password: SHARED_USER.password }
  25  |     });
  26  |     const { access_token } = await res.json();
  27  |     authToken = access_token;
  28  |   });
  29  | 
  30  |   test.afterAll(async ({ request }) => {
  31  |     await deleteTestUser(request, SHARED_USER.email, SHARED_USER.password);
  32  |   });
  33  | 
  34  |   test.beforeEach(async ({ page }) => {
  35  |     const loginPage = new LoginPage(page);
  36  |     await loginPage.navigate();
  37  |     await loginPage.fillEmail(SHARED_USER.email);
  38  |     await loginPage.fillPassword(SHARED_USER.password);
  39  |     await loginPage.clickLogin();
> 40  |     await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  41  |     await page.waitForLoadState('networkidle');
  42  |   });
  43  | 
  44  |   test('should create a job via UI and verify via API', async ({ page, request }) => {
  45  |     const ts = Date.now();
  46  |     const companyName = `E2E Create ${ts}`;
  47  | 
  48  |     // Create via UI
  49  |     await page.getByTestId('add-application-btn').click();
  50  |     await page.getByTestId('job-company-input').fill(companyName);
  51  |     await page.getByTestId('job-position-input').fill('QA Engineer');
  52  |     await page.getByTestId('job-status-select').selectOption('applied');
  53  |     await page.getByTestId('job-submit-btn').click();
  54  |     await page.waitForLoadState('networkidle');
  55  | 
  56  |     // Verify in UI
  57  |     await expect(page.getByText(companyName)).toBeVisible({ timeout: 10000 });
  58  | 
  59  |     // Verify via API
  60  |     const res = await request.get(`${API_URL}/jobs`, {
  61  |       headers: { Authorization: `Bearer ${authToken}` }
  62  |     });
  63  |     const data = await res.json();
  64  |     const jobs = data.items;
  65  |     const created = jobs.find((j: any) => j.company_name === companyName);
  66  |     expect(created).toBeDefined();
  67  |     expect(created.company_name).toBe(companyName);
  68  | 
  69  |     // Cleanup
  70  |     if (created) {
  71  |       await request.delete(`${API_URL}/jobs/${created.id}`, {
  72  |         headers: { Authorization: `Bearer ${authToken}` }
  73  |       });
  74  |     }
  75  |   });
  76  | 
  77  |   test('should update job status via UI and verify via API', async ({ page, request }) => {
  78  |     const ts = Date.now();
  79  |     const companyName = `E2E Update ${ts}`;
  80  | 
  81  |     // Create via UI
  82  |     await page.getByTestId('add-application-btn').click();
  83  |     await page.getByTestId('job-company-input').fill(companyName);
  84  |     await page.getByTestId('job-position-input').fill('Tester');
  85  |     await page.getByTestId('job-status-select').selectOption('applied');
  86  |     await page.getByTestId('job-submit-btn').click();
  87  |     await page.waitForLoadState('networkidle');
  88  |     await expect(page.getByText(companyName)).toBeVisible({ timeout: 10000 });
  89  | 
  90  |     // Find the specific job card and click its edit button
  91  |     const jobCard = page.locator('[data-testid="job-card"]')
  92  |       .filter({ hasText: companyName });
  93  |     await jobCard.getByTestId('job-edit-btn').click();
  94  | 
  95  |     await page.getByTestId('job-status-select').waitFor({ state: 'visible', timeout: 10000 });
  96  |     await page.getByTestId('job-status-select').selectOption('phone_interview');
  97  |     await page.getByTestId('job-save-btn').click();
  98  |     // Wait for edit form to close (modal disappears)
  99  |     await page.waitForSelector('[data-testid="job-save-btn"]',
  100 |       { state: 'hidden', timeout: 10000 });
  101 |     await page.waitForLoadState('networkidle');
  102 | 
  103 |     // Verify via API
  104 |     const listRes = await request.get(`${API_URL}/jobs`, {
  105 |       headers: { Authorization: `Bearer ${authToken}` }
  106 |     });
  107 |     const listData = await listRes.json();
  108 |     const updatedJob = listData.items.find((j: any) => j.company_name === companyName);
  109 |     expect(updatedJob).toBeDefined();
  110 |     expect(updatedJob.status).toBe('phone_interview');
  111 | 
  112 |     // Cleanup
  113 |     if (updatedJob) {
  114 |       await request.delete(`${API_URL}/jobs/${updatedJob.id}`, {
  115 |         headers: { Authorization: `Bearer ${authToken}` }
  116 |       });
  117 |     }
  118 |   });
  119 | 
  120 |   test('should delete job via UI and verify via API', async ({ page, request }) => {
  121 |     const ts = Date.now();
  122 |     const companyName = `E2E Delete ${ts}`;
  123 | 
  124 |     // Create via UI
  125 |     await page.getByTestId('add-application-btn').click();
  126 |     await page.getByTestId('job-company-input').fill(companyName);
  127 |     await page.getByTestId('job-position-input').fill('Tester');
  128 |     await page.getByTestId('job-status-select').selectOption('applied');
  129 |     await page.getByTestId('job-submit-btn').click();
  130 |     await page.waitForLoadState('networkidle');
  131 |     await expect(page.getByText(companyName)).toBeVisible({ timeout: 10000 });
  132 | 
  133 |     // Get job id before deleting
  134 |     const listRes = await request.get(`${API_URL}/jobs`, {
  135 |       headers: { Authorization: `Bearer ${authToken}` }
  136 |     });
  137 |     const listData = await listRes.json();
  138 |     const job = listData.items.find((j: any) => j.company_name === companyName);
  139 | 
  140 |     // Set dialog handler BEFORE clicking
```