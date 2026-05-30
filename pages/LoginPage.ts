import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    const base = process.env.BASE_URL || 'http://localhost:5173';
    await this.page.goto(`${base}/login`);
  }

  async navigate() {
    await this.page.goto(`${process.env.BASE_URL || 'https://job-tracker-frontend-green-sigma.vercel.app'}/login`);
  }

  async fillEmail(email: string) {
    await this.page.fill('input[type="email"]', email);
  }

  async fillPassword(password: string) {
    await this.page.fill('input[type="password"]', password);
  }

  async clickLogin() {
    await this.page.click('button[type="submit"]');
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
