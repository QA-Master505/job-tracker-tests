import { Page, expect } from '@playwright/test';

export class ProfilePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/profile');
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/profile/);
  }

  // "Change Username" section — only text input on the page
  async updateUsername(username: string) {
    const input = this.page.locator('input[type="text"]');
    await input.clear();
    await input.fill(username);
  }

  // "Change Email" section — the email input (Account Details shows email as plain text, not an input)
  async updateEmail(email: string) {
    const input = this.page.locator('input[type="email"]');
    await input.clear();
    await input.fill(email);
  }

  // Submits the Change Username section (first Save Changes button on the page)
  async saveProfile() {
    await this.page.locator('div.rounded-xl:has(input[type="text"]) button[type="submit"]').click();
  }

  // Submits the Change Email section specifically
  async saveEmailSection() {
    await this.page.locator('div.rounded-xl:has(input[type="email"]) button[type="submit"]').click();
  }

  // Success: StatusMessage renders <p> with bg-green-50 / text-green-700
  async getSuccessMessage() {
    const el = this.page.locator('p.text-green-700').first();
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
