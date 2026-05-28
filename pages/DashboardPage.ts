import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForDashboard() {
    await this.page.waitForURL('**/dashboard');
    await this.page.waitForLoadState('networkidle');
    // Add Application button (rounded-lg) must be visible
    await expect(this.page.locator('button:has-text("Add Application")')).toBeVisible({ timeout: 15000 });
    // Stats bar buttons (rounded-xl) — All / Applied / Interview / Offer / Rejected
    await expect(this.page.locator('button.rounded-xl').first()).toBeVisible({ timeout: 10000 });
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async openAddJobModal() {
    await this.page.getByTestId('add-application-btn').click();
  }

  // JobForm has no name attrs — identify inputs by placeholder
  async fillJobForm(data: {
    company_name: string;
    job_title: string;
    job_url?: string;
    status?: string;
    applied_date?: string;
    notes?: string;
  }) {
    await this.page.getByTestId('job-company-input').fill(data.company_name);
    await this.page.getByTestId('job-position-input').fill(data.job_title);
    if (data.job_url) {
      await this.page.fill('input[placeholder="e.g. linkedin.com/jobs/123"]', data.job_url);
    }
    if (data.status) {
      await this.page.getByTestId('job-status-select').selectOption(data.status);
    }
    if (data.applied_date) {
      await this.page.fill('input[type="date"]', data.applied_date);
    }
    if (data.notes) {
      await this.page.fill('textarea[placeholder="Any notes about this application..."]', data.notes);
    }
  }

  async submitJobForm() {
    await this.page.getByTestId('job-submit-btn').click();
  }

  async jobExists(companyName: string) {
    return await this.page.isVisible(`text=${companyName}`);
  }

  async clickJobCard(companyName: string) {
    await this.page.getByTestId('job-edit-btn').first().click();
  }

  async deleteJob(companyName: string) {
    this.page.once('dialog', dialog => dialog.accept());
    await this.page.getByTestId('job-delete-btn').first().click();
  }

  async logout() {
    await this.page.getByTestId('logout-btn').click();
  }
}
