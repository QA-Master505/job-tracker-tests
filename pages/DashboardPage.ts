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
    // Button text is "+ Add Application"
    await this.page.click('button:has-text("Add Application")');
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
    await this.page.fill('input[placeholder="e.g. Google"]', data.company_name);
    await this.page.fill('input[placeholder="e.g. Frontend Engineer"]', data.job_title);
    if (data.job_url) {
      await this.page.fill('input[placeholder="e.g. linkedin.com/jobs/123"]', data.job_url);
    }
    if (data.status) {
      await this.page.selectOption('select', data.status);
    }
    if (data.applied_date) {
      await this.page.fill('input[type="date"]', data.applied_date);
    }
    if (data.notes) {
      await this.page.fill('textarea[placeholder="Any notes about this application..."]', data.notes);
    }
  }

  async submitJobForm() {
    // Only the modal form's submit button has type="submit"; the header button does not
    await this.page.click('button[type="submit"]');
  }

  async jobExists(companyName: string) {
    return await this.page.isVisible(`text=${companyName}`);
  }

  // Clicks the Edit button on the card matching companyName → opens JobForm modal
  async clickJobCard(companyName: string) {
    const card = this.page
      .locator('div.bg-white.rounded-xl')
      .filter({ hasText: companyName })
      .last();
    await card.waitFor({ state: 'visible', timeout: 15000 });
    await card.locator('button:has-text("Edit")').click();
  }

  async deleteJob(companyName: string) {
    const card = this.page
      .locator('div:has(button:has-text("Delete"))')
      .filter({ hasText: companyName })
      .last();
    this.page.once('dialog', dialog => dialog.accept());
    await card.locator('button:has-text("Delete")').click();
  }

  async logout() {
    await this.page.click('button:has-text("Logout"), [data-testid="logout"]');
  }
}
