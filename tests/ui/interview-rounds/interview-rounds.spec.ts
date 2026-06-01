import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { testJob } from '../../../fixtures/test-data';
import { createTestUser, deleteTestUser, TestUser } from '../../../fixtures/auth';
import { createJob, deleteJob } from '../../../helpers/api-helpers';

test.describe('Interview Rounds', () => {
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
    jobCompanyName = `IR Co ${Date.now()}`;
    const response = await createJob(request, testUser.cookieHeader, {
      ...testJob,
      company_name: jobCompanyName,
      status: 'phone_interview',
    });
    const job = await response.json();
    jobId = job.id;

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.goto('/dashboard');
  });

  test.afterEach(async ({ request }) => {
    if (jobId) {
      await deleteJob(request, testUser.cookieHeader, jobId).catch(() => {});
    }
  });

  test('should display the Interview Rounds section for non-applied jobs', async ({ page }) => {
    await expect(page.locator(`text=${jobCompanyName}`).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Interview Rounds")')).toBeVisible({ timeout: 10000 });
  });

  test('should add an interview round to a job', async ({ page }) => {
    await expect(page.locator(`text=${jobCompanyName}`).first()).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Interview Rounds")');
    await page.click('button:has-text("Add Interview Round")');
    await page.selectOption('select', 'phone');
    await page.fill('input[type="date"]', '2026-06-01');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Round 1')).toBeVisible({ timeout: 10000 });
  });

  test('should delete an interview round', async ({ page }) => {
    await expect(page.locator(`text=${jobCompanyName}`).first()).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Interview Rounds")');
    await page.click('button:has-text("Add Interview Round")');
    await page.selectOption('select', 'phone');
    await page.fill('input[type="date"]', '2026-06-01');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Round 1')).toBeVisible({ timeout: 10000 });

    const roundDeleteBtn = page.locator('div.bg-gray-50.rounded-lg button:has-text("Delete")').first();
    page.once('dialog', dialog => dialog.accept());
    await roundDeleteBtn.click();

    await expect(page.locator('text=Round 1')).not.toBeVisible({ timeout: 10000 });
  });
});
