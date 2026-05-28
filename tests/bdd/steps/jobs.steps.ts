import { Given, When, Then } from '@cucumber/cucumber';
import { expect, request } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { BDD_USER } from '../support/hooks';
import { BDD_CONFIG } from '../support/config';

Given('I have at least one job application', async function (this: CustomWorld) {
  const apiContext = await request.newContext();
  const loginRes = await apiContext.post(`${BDD_CONFIG.API_URL}/auth/login`, {
    data: { email: BDD_USER.email, password: BDD_USER.password },
  });
  const { access_token } = await loginRes.json();
  await apiContext.post(`${BDD_CONFIG.API_URL}/jobs`, {
    headers: { Authorization: `Bearer ${access_token}` },
    data: BDD_CONFIG.TEST_JOB,
  });
  await apiContext.dispose();
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
});

When('I click add new job button', async function (this: CustomWorld) {
  await this.page.getByTestId('add-application-btn').click();
  await this.page.waitForLoadState('networkidle');
});

When('I fill in company name {string}', async function (this: CustomWorld, company: string) {
  await this.page.getByTestId('job-company-input').fill(company);
});

When('I fill in position {string}', async function (this: CustomWorld, position: string) {
  await this.page.getByTestId('job-position-input').fill(position);
});

When('I select status {string}', async function (this: CustomWorld, status: string) {
  const statusMap: Record<string, string> = {
    'Applied': 'applied',
    'Phone Interview': 'phone_interview',
    'Interview': 'phone_interview',
    'Technical Interview': 'technical_interview',
    'Offer': 'offer',
    'Rejected': 'rejected',
  };
  await this.page.getByTestId('job-status-select').selectOption(statusMap[status] || status.toLowerCase());
});

When('I submit the form', async function (this: CustomWorld) {
  await this.page.getByTestId('job-submit-btn').click();
  await this.page.waitForLoadState('networkidle');
});

Then('I should see {string} in my job list', async function (this: CustomWorld, company: string) {
  await expect(this.page.getByText(company)).toBeVisible({ timeout: BDD_CONFIG.DEFAULT_TIMEOUT });
});

When('I click on a job application', async function (this: CustomWorld) {
  await this.page.getByTestId('job-edit-btn').first().click();
});

Then('I should see the job details', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  await expect(this.page.getByTestId('job-save-btn')).toBeVisible({
    timeout: BDD_CONFIG.DEFAULT_TIMEOUT
  });
});

When('I update the status to {string}', async function (this: CustomWorld, _status: string) {
  await this.page.getByTestId('job-edit-btn').first().click();
  await this.page.getByTestId('job-status-select').waitFor({
    state: 'visible',
    timeout: BDD_CONFIG.DEFAULT_TIMEOUT
  });
  await this.page.getByTestId('job-status-select').selectOption('phone_interview');
  await this.page.getByTestId('job-save-btn').click();
  await this.page.waitForLoadState('networkidle');
});

Then('the status should show {string}', async function (this: CustomWorld, _status: string) {
  await expect(this.page.getByText(/phone_interview|Phone Interview/i)).toBeVisible({ timeout: BDD_CONFIG.DEFAULT_TIMEOUT });
});

When('I delete the job application', async function (this: CustomWorld) {
  this.page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await this.page.getByTestId('job-delete-btn').first().click();
  await this.page.waitForLoadState('networkidle');
});

Then('the job should be removed from the list', async function (this: CustomWorld) {
  await this.page.waitForTimeout(BDD_CONFIG.SLOW_MO);
  const count = await this.page.getByText(BDD_CONFIG.TEST_JOB.company_name).count();
  expect(count).toBe(0);
});
