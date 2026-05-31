import { test, expect } from '@playwright/test';
import {
  getAuthToken,
  createJob,
  deleteJob,
  createInterviewRound,
  getInterviewRounds,
} from '../../helpers/api-helpers';
import { testJob, testInterviewRound } from '../../fixtures/test-data';
import { createTestUser, deleteTestUser, TestUser } from '../../fixtures/auth';

const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';

test.describe('Interview Rounds API', () => {
  let token: string;
  let jobId: string;
  let testUser: TestUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
    token = await getAuthToken(request, testUser.email, testUser.password);
    // Use a distinct name so create-job.spec.ts afterEach cleanup never touches this job
    const response = await createJob(request, token, { ...testJob, company_name: 'API Interview Test Job' });
    const job = await response.json();
    jobId = job.id;
  });

  test.afterAll(async ({ request }) => {
    if (jobId && token) {
      await deleteJob(request, token, jobId);
    }
    await deleteTestUser(request, testUser.email, testUser.password);
  });

  test('POST /jobs/:id/interviews — should create a new interview round', async ({ request }) => {
    const response = await createInterviewRound(request, token, jobId, testInterviewRound);
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.interview_type).toBe(testInterviewRound.interview_type);
  });

  test('POST /jobs/:id/interviews — should return 401 without auth token', async ({ request }) => {
    const response = await request.post(`${API_URL}/jobs/${jobId}/interviews`, {
      data: testInterviewRound,
    });
    expect(response.status()).toBe(401);
  });

  test('POST /jobs/:id/interviews — should return 404 for non-existent job', async ({ request }) => {
    const response = await createInterviewRound(
      request,
      token,
      '999999',
      testInterviewRound,
    );
    expect(response.status()).toBe(404);
  });

  test('GET /jobs/:id/interviews — should return interview rounds for a job', async ({ request }) => {
    await createInterviewRound(request, token, jobId, testInterviewRound);
    const response = await getInterviewRounds(request, token, jobId);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  });

  test('GET /jobs/:id/interviews — should return 401 without auth token', async ({ request }) => {
    const response = await request.get(`${API_URL}/jobs/${jobId}/interviews`);
    expect(response.status()).toBe(401);
  });

  test('DELETE /jobs/:jobId/interviews/:roundId — should delete an interview round', async ({ request }) => {
    const created = await createInterviewRound(request, token, jobId, testInterviewRound);
    expect(created.status()).toBe(201);
    const round = await created.json();
    const response = await request.delete(`${API_URL}/jobs/${jobId}/interviews/${round.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(response.status());
  });
});
