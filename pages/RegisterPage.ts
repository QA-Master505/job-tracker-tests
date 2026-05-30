import { Page, expect } from '@playwright/test';

export class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    const base = process.env.BASE_URL || 'http://localhost:5173';
    await this.page.goto(`${base}/register`);
  }

  // Inputs have no name/id — ordered as: username (text), email, password
  async register(username: string, email: string, password: string) {
    await this.page.fill('input[type="text"]', username);
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  // Error is a <p> with class bg-red-50 (no role="alert" or data-testid)
  async getErrorMessage() {
    const el = this.page.locator('p.bg-red-50');
    await el.waitFor({ timeout: 5000 }).catch(() => {});
    return await el.textContent().catch(() => null);
  }

  async expectRegisterPageVisible() {
    await expect(this.page).toHaveURL(/\/register/);
  }

  // Successful registration redirects to /login
  async expectSuccessRedirect() {
    await expect(this.page).toHaveURL(/\/login/, { timeout: 10000 });
  }
}
