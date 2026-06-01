import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage';
import { testJob } from '../../../fixtures/test-data';
import { createTestUser, deleteTestUser, TestUser } from '../../../fixtures/auth';
import { createJob, deleteJob } from '../../../helpers/api-helpers';

test.describe('Delete Job', () => {
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
    jobCompanyName = `Delete Job Co ${Date.now()}`;
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

  test('should delete a job application', async ({ page }) => {
    await expect(page.locator(`text=${jobCompanyName}`).first()).toBeVisible({ timeout: 10000 });
    await dashboardPage.deleteJob(jobCompanyName);
    await expect(page.locator(`text=${jobCompanyName}`)).not.toBeVisible({ timeout: 10000 });
    jobId = '';
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
