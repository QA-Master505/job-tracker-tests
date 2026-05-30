import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage';
import { testJob } from '../../../fixtures/test-data';
import { createTestUser, TestUser } from '../../../fixtures/auth';
import { getAuthToken, createJob, deleteJob } from '../../../helpers/api-helpers';

test.describe('Delete Job', () => {
  let dashboardPage: DashboardPage;
  let token: string;
  let jobId: string;
  let jobCompanyName: string; // unique per test run to avoid parallel-worker interference
  let testUser: TestUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test.beforeEach(async ({ page, request }) => {
    token = await getAuthToken(request, testUser.email, testUser.password);
    // Timestamp-based name ensures isolation even when tests run concurrently
    jobCompanyName = `Delete Job Co ${Date.now()}`;
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
    // Job may already be deleted by the test; ignore 404
    if (jobId && token) {
      await deleteJob(request, token, jobId).catch(() => {});
    }
  });

  test('should delete a job application', async ({ page }) => {
    await expect(page.locator(`text=${jobCompanyName}`).first()).toBeVisible({ timeout: 10000 });
    await dashboardPage.deleteJob(jobCompanyName);
    await expect(page.locator(`text=${jobCompanyName}`)).not.toBeVisible({ timeout: 10000 });
    jobId = ''; // already deleted
  });

  test('should show confirmation dialog before deleting', async ({ page }) => {
    const card = page.locator('[data-testid="job-card"]')
      .filter({ hasText: jobCompanyName });
    await card.waitFor({ state: 'visible', timeout: 15000 });

    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await card.getByTestId('job-delete-btn').click();

    expect(dialogMessage).toBeTruthy();
  });
});
