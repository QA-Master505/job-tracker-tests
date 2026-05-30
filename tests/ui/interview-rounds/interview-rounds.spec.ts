import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { testJob } from '../../../fixtures/test-data';
import { createTestUser, TestUser } from '../../../fixtures/auth';
import { getAuthToken, createJob, deleteJob } from '../../../helpers/api-helpers';

test.describe('Interview Rounds', () => {
  let jobId: string;
  let token: string;
  let jobCompanyName: string; // unique per test run to avoid parallel-worker interference
  let testUser: TestUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test.beforeEach(async ({ page, request }) => {
    token = await getAuthToken(request, testUser.email, testUser.password);
    // Timestamp-based name ensures isolation even when tests run concurrently
    jobCompanyName = `IR Co ${Date.now()}`;
    // Must use a non-applied status — HIDE_ROUNDS_STATUSES = ["applied", "no_response"]
    const response = await createJob(request, token, {
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
    if (jobId && token) {
      await deleteJob(request, token, jobId).catch(() => {});
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
    // "Add Round" is the submit button text for new rounds
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

    // InterviewRoundCard container has bg-gray-50 rounded-lg (distinct from job card bg-white rounded-xl)
    const roundDeleteBtn = page.locator('div.bg-gray-50.rounded-lg button:has-text("Delete")').first();
    page.once('dialog', dialog => dialog.accept());
    await roundDeleteBtn.click();

    await expect(page.locator('text=Round 1')).not.toBeVisible({ timeout: 10000 });
  });
});
