import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage';
import { testUser, testJob } from '../../../fixtures/test-data';
import { getAuthToken, createJob, deleteJob } from '../../../helpers/api-helpers';

test.describe('Update Job', () => {
  let dashboardPage: DashboardPage;
  let jobId: string;
  let token: string;
  let jobCompanyName: string; // unique per test run to avoid parallel-worker interference

  test.beforeEach(async ({ page, request }) => {
    token = await getAuthToken(request, testUser.email, testUser.password);
    // Timestamp-based name ensures isolation even when tests run concurrently
    jobCompanyName = `Update Job Co ${Date.now()}`;
    const response = await createJob(request, token, { ...testJob, company_name: jobCompanyName });
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
    if (jobId && token) {
      await deleteJob(request, token, jobId).catch(() => {});
    }
  });

  test('should update job status', async ({ page }) => {
    await dashboardPage.clickJobCard(jobCompanyName);
    // Status select has no name attr — target the <select> inside the modal
    await page.selectOption('select', 'phone_interview');
    await page.click('button:has-text("Save Changes")');
    // Status badge is a <span class="... rounded-full ..."> — avoids matching the modal's <option>
    await expect(page.locator('span.rounded-full:has-text("Phone Interview")')).toBeVisible({ timeout: 10000 });
  });

  test('should update job notes', async ({ page }) => {
    await dashboardPage.clickJobCard(jobCompanyName);
    // Notes textarea has no name attr
    const notes = page.locator('textarea');
    await notes.clear();
    await notes.fill('Updated notes via Playwright test');
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Updated notes via Playwright test')).toBeVisible({ timeout: 10000 });
  });
});
