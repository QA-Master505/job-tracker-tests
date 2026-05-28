import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const BASE_URL = process.env.BASE_URL || 'https://job-tracker-frontend-green-sigma.vercel.app';
const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';

// Shared user for all tests - created once
const SHARED_USER = {
  email: `e2e_${Date.now()}@test.com`,
  username: `e2euser_${Date.now()}`,
  password: 'Test123!',
};

let authToken = '';

test.describe('Job Journey E2E', () => {

  test.beforeAll(async ({ request }) => {
    // Register user
    await request.post(`${API_URL}/auth/register`, { data: SHARED_USER });
    // Get token
    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: SHARED_USER.email, password: SHARED_USER.password }
    });
    const { access_token } = await res.json();
    authToken = access_token;
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.fillEmail(SHARED_USER.email);
    await loginPage.fillPassword(SHARED_USER.password);
    await loginPage.clickLogin();
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20000 });
    await page.waitForLoadState('networkidle');
  });

  test('should create a job via UI and verify via API', async ({ page, request }) => {
    const ts = Date.now();
    const companyName = `E2E Create ${ts}`;

    // Create via UI
    await page.getByTestId('add-application-btn').click();
    await page.getByTestId('job-company-input').fill(companyName);
    await page.getByTestId('job-position-input').fill('QA Engineer');
    await page.getByTestId('job-status-select').selectOption('applied');
    await page.getByTestId('job-submit-btn').click();
    await page.waitForLoadState('networkidle');

    // Verify in UI
    await expect(page.getByText(companyName)).toBeVisible({ timeout: 10000 });

    // Verify via API
    const res = await request.get(`${API_URL}/jobs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await res.json();
    const jobs = data.items || data;
    const created = jobs.find((j: any) => j.company_name === companyName);
    expect(created).toBeDefined();
    expect(created.company_name).toBe(companyName);

    // Cleanup
    if (created) {
      await request.delete(`${API_URL}/jobs/${created.id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }
  });

  test('should update job status via UI and verify via API', async ({ page, request }) => {
    const ts = Date.now();
    const companyName = `E2E Update ${ts}`;

    // Create via UI
    await page.getByTestId('add-application-btn').click();
    await page.getByTestId('job-company-input').fill(companyName);
    await page.getByTestId('job-position-input').fill('Tester');
    await page.getByTestId('job-status-select').selectOption('applied');
    await page.getByTestId('job-submit-btn').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(companyName)).toBeVisible({ timeout: 10000 });

    // Find the specific job card and click its edit button
    const jobCard = page.locator('[data-testid="job-card"]')
      .filter({ hasText: companyName });
    await jobCard.getByTestId('job-edit-btn').click();

    await page.getByTestId('job-status-select').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByTestId('job-status-select').selectOption('phone_interview');
    await page.getByTestId('job-save-btn').click();
    // Wait for edit form to close (modal disappears)
    await page.waitForSelector('[data-testid="job-save-btn"]',
      { state: 'hidden', timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify via API
    const listRes = await request.get(`${API_URL}/jobs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const listData = await listRes.json();
    const updatedJob = (listData.items || listData).find((j: any) => j.company_name === companyName);
    expect(updatedJob).toBeDefined();
    expect(updatedJob.status).toBe('phone_interview');

    // Cleanup
    if (updatedJob) {
      await request.delete(`${API_URL}/jobs/${updatedJob.id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }
  });

  test('should delete job via UI and verify via API', async ({ page, request }) => {
    const ts = Date.now();
    const companyName = `E2E Delete ${ts}`;

    // Create via UI
    await page.getByTestId('add-application-btn').click();
    await page.getByTestId('job-company-input').fill(companyName);
    await page.getByTestId('job-position-input').fill('Tester');
    await page.getByTestId('job-status-select').selectOption('applied');
    await page.getByTestId('job-submit-btn').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(companyName)).toBeVisible({ timeout: 10000 });

    // Get job id before deleting
    const listRes = await request.get(`${API_URL}/jobs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const listData = await listRes.json();
    const job = (listData.items || listData).find((j: any) => j.company_name === companyName);

    // Set dialog handler BEFORE clicking
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    // Click delete on specific job card
    const deleteCard = page.locator('[data-testid="job-card"]')
      .filter({ hasText: companyName });
    await deleteCard.getByTestId('job-delete-btn').click();
    // Wait for job to disappear from UI
    await expect(page.getByText(companyName)).toBeHidden({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify via API - should be 404
    if (job) {
      const verifyRes = await request.get(`${API_URL}/jobs/${job.id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      expect(verifyRes.status()).toBe(404);
    }
  });
});
