import { APIRequestContext } from '@playwright/test';

if (!process.env.API_URL) {
  throw new Error(
    'API_URL environment variable is not set. ' +
    'Run with API_URL=https://... or add it to your .env.test file.'
  );
}

const API_URL = process.env.API_URL;

export async function registerUser(request: APIRequestContext, userData: object) {
  return await request.post(`${API_URL}/auth/register`, {
    data: userData,
  });
}

export async function loginUser(request: APIRequestContext, email: string, password: string) {
  return await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
}

export async function getAuthToken(request: APIRequestContext, email: string, password: string): Promise<string> {
  const response = await loginUser(request, email, password);
  const body = await response.json();
  return body.access_token;
}

export async function createJob(request: APIRequestContext, token: string, jobData: object) {
  return await request.post(`${API_URL}/jobs`, {
    headers: { Authorization: `Bearer ${token}` },
    data: jobData,
  });
}

export async function getJobs(request: APIRequestContext, token: string) {
  return await request.get(`${API_URL}/jobs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getJobById(request: APIRequestContext, token: string, jobId: string) {
  return await request.get(`${API_URL}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateJob(request: APIRequestContext, token: string, jobId: string, jobData: object) {
  return await request.put(`${API_URL}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: jobData,
  });
}

export async function deleteJob(request: APIRequestContext, token: string, jobId: string) {
  return await request.delete(`${API_URL}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createInterviewRound(
  request: APIRequestContext,
  token: string,
  jobId: string,
  roundData: object,
) {
  return await request.post(`${API_URL}/jobs/${jobId}/interviews`, {
    headers: { Authorization: `Bearer ${token}` },
    data: roundData,
  });
}

export async function getInterviewRounds(request: APIRequestContext, token: string, jobId: string) {
  return await request.get(`${API_URL}/jobs/${jobId}/interviews`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
