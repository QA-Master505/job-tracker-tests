import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { DashboardPage } from '../../../pages/DashboardPage';
import { testUser, testJob } from '../../../fixtures/test-data';
import { getAuthToken, getJobs, deleteJob } from '../../../helpers/api-helpers';

test.describe('Create Job', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    dashboardPage = new DashboardPage(page);
  });

  test.afterEach(async ({ request }) => {
    // Clean up any jobs created by these tests
    const token = await getAuthToken(request, testUser.email, testUser.password);
    const resp = await getJobs(request, token);
    if (resp.ok()) {
      const jobs: { id: string; company_name: string }[] = await resp.json();
      for (const job of jobs.filter(j => j.company_name === testJob.company_name)) {
        await deleteJob(request, token, job.id);
      }
    }
  });

  test('should display the Add Application button on the dashboard', async ({ page }) => {
    // Wait for dashboard to fully load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for the Add Application button to be visible
    await expect(page.getByText('+ Add Application')).toBeVisible({ timeout: 15000 });
  });

  test('should open the add job modal', async ({ page }) => {
    await dashboardPage.openAddJobModal();
    // JobForm modal shows Company Name input with placeholder "e.g. Google"
    await expect(page.locator('input[placeholder="e.g. Google"]')).toBeVisible();
  });

  test('should create a new job application', async ({ page }) => {
    await dashboardPage.openAddJobModal();
    await dashboardPage.fillJobForm(testJob);
    await dashboardPage.submitJobForm();
    // Modal closes; company name should appear on the dashboard
    await expect(page.locator(`text=${testJob.company_name}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error when required fields are missing', async ({ page }) => {
    await dashboardPage.openAddJobModal();
    // Use type="submit" to target the modal form button (not the backdrop-blocked header button)
    await page.click('button[type="submit"]');
    const nativeInvalid = await page.locator('input:invalid').count();
    const serverError = await page.locator('p.bg-red-50').count();
    expect(nativeInvalid > 0 || serverError > 0).toBeTruthy();
  });
});
