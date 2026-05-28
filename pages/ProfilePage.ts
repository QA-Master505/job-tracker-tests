import { Page, expect } from '@playwright/test';

export class ProfilePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/profile');
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/profile/);
  }

  async updateUsername(username: string) {
    const input = this.page.getByTestId('profile-username-input');
    await input.clear();
    await input.fill(username);
  }

  async updateEmail(email: string) {
    const input = this.page.getByTestId('profile-email-input');
    await input.clear();
    await input.fill(email);
  }

  async saveProfile() {
    await this.page.getByTestId('save-username-btn').click();
  }

  async saveEmailSection() {
    await this.page.getByTestId('save-email-btn').click();
  }

  async getSuccessMessage() {
    const el = this.page.getByTestId('profile-success-msg');
    await el.waitFor({ timeout: 5000 }).catch(() => {});
    return await el.textContent().catch(() => null);
  }

  // Error: StatusMessage renders <p> with bg-red-50 / text-red-700
  async getErrorMessage() {
    const el = this.page.locator('p.text-red-700').first();
    await el.waitFor({ timeout: 5000 }).catch(() => {});
    return await el.textContent().catch(() => null);
  }
}
