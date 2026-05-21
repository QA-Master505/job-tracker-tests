import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async isLoggedIn() {
    return await this.page.isVisible('text=My Applications');
  }

  // Error is a <p> with class bg-red-50 (no role="alert" or data-testid)
  async getErrorMessage() {
    const el = this.page.locator('p.bg-red-50');
    await el.waitFor({ timeout: 5000 }).catch(() => {});
    return await el.textContent().catch(() => null);
  }

  async expectLoginPageVisible() {
    await expect(this.page).toHaveURL(/\/login/);
  }
}
