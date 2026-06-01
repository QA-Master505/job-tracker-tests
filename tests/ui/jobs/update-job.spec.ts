import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage';
import { testJob } from '../../../fixtures/test-data';
import { createTestUser, deleteTestUser, TestUser } from '../../../fixtures/auth';
import { createJob, deleteJob } from '../../../helpers/api-helpers';

test.describe('Update Job', () => {
  let dashboardPage: DashboardPage;
  let jobId: string;
  let jobCompanyName: string;
  let testUser: TestUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, testUser.email, testUser.password, testUser.cookieHeader);
  });

  test.beforeEach(async ({ page, request }) => {
    jobCompanyName = `Update Job Co ${Date.now()}`;
    const response = await createJob(request, testUser.cookieHeader, { ...testJob, company_name: jobCompanyName });
    const job = await response.json();
    jobId = job.id;

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test.afterEach(async ({ request }) => {
    if (jobId) {
      await deleteJob(request, testUser.cookieHeader, jobId).catch(() => {});
    }
  });

  test('should update job status', async ({ page }) => {
    await dashboardPage.clickJobCard(jobCompanyName);
    await page.getByTestId('job-status-select').selectOption('phone_interview');
    await page.getByTestId('job-save-btn').click();
    await expect(page.locator('span.rounded-full:has-text("Phone Interview")')).toBeVisible({ timeout: 10000 });
  });

  test('should update job notes', async ({ page }) => {
    await dashboardPage.clickJobCard(jobCompanyName);
    const notes = page.locator('textarea');
    await notes.clear();
    await notes.fill('Updated notes via Playwright test');
    await page.getByTestId('job-save-btn').click();
    await expect(page.locator('text=Updated notes via Playwright test')).toBeVisible({ timeout: 10000 });
  });
});
