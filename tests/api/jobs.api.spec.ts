import { test, expect } from '@playwright/test';
import { getAuthToken, createJob, getJobs, updateJob, deleteJob } from '../../helpers/api-helpers';
import { testJob } from '../../fixtures/test-data';
import { createTestUser, TestUser } from '../../fixtures/auth';

const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';

test.describe('Jobs API', () => {
  let token: string;
  let createdJobId: string;
  let testUser: TestUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
    token = await getAuthToken(request, testUser.email, testUser.password);
  });

  test.afterEach(async ({ request }) => {
    if (createdJobId) {
      await deleteJob(request, token, createdJobId);
      createdJobId = '';
    }
  });

  test('POST /jobs — should create a new job application', async ({ request }) => {
    const response = await createJob(request, token, testJob);
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.company_name).toBe(testJob.company_name);
    expect(body.job_title).toBe(testJob.job_title);
    createdJobId = body.id;
  });

  test('POST /jobs — should return 401 without auth token', async ({ request }) => {
    const response = await request.post(`${API_URL}/jobs`, {
      data: testJob,
    });
    expect(response.status()).toBe(401);
  });

  test('POST /jobs — should return 422 for missing required fields', async ({ request }) => {
    const response = await createJob(request, token, { notes: 'missing required fields' });
    expect([400, 422]).toContain(response.status());
  });

  test('GET /jobs — should return list of job applications', async ({ request }) => {
    const created = await createJob(request, token, testJob);
    const job = await created.json();
    createdJobId = job.id;

    const response = await getJobs(request, token);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /jobs — should return 401 without auth token', async ({ request }) => {
    const response = await request.get(`${API_URL}/jobs`);
    expect(response.status()).toBe(401);
  });

  test('PUT /jobs/:id — should update a job application', async ({ request }) => {
    const created = await createJob(request, token, testJob);
    const job = await created.json();
    createdJobId = job.id;

    const response = await updateJob(request, token, createdJobId, { status: 'phone_interview' });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('phone_interview');
  });

  test('PUT /jobs/:id — should return 404 for non-existent job', async ({ request }) => {
    const response = await updateJob(request, token, '99999', { status: 'phone_interview' });
    expect(response.status()).toBe(404);
  });

  test('DELETE /jobs/:id — should delete a job application', async ({ request }) => {
    const created = await createJob(request, token, testJob);
    const job = await created.json();
    const response = await deleteJob(request, token, job.id);
    expect([200, 204]).toContain(response.status());
  });

  test('DELETE /jobs/:id — should return 404 for non-existent job', async ({ request }) => {
    const response = await deleteJob(request, token, '999999');
    expect(response.status()).toBe(404);
  });
});
