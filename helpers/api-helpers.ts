import { APIRequestContext } from '@playwright/test';

if (!process.env.API_URL) {
  throw new Error(
    'API_URL environment variable is not set. ' +
    'Run with API_URL=https://... or add it to your .env.test file.',
  );
}

const API_URL = process.env.API_URL;

// ---------------------------------------------------------------------------
// Internal auth header builder
// ---------------------------------------------------------------------------
// All helper functions accept an `auth` string which is EITHER:
//   • a Bearer token  — plain JWT, no "Bearer " prefix
//   • a cookie string — starts with "access_token="
//
// Existing call sites that pass a Bearer token continue to work unchanged.
// ---------------------------------------------------------------------------
function buildAuthHeader(auth: string): Record<string, string> {
  if (auth.startsWith('access_token=')) {
    return { Cookie: auth };
  }
  return { Authorization: `Bearer ${auth}` };
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function registerUser(request: APIRequestContext, userData: object) {
  return request.post(`${API_URL}/auth/register`, { data: userData });
}

export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  return request.post(`${API_URL}/auth/login`, { data: { email, password } });
}

/** Returns the Bearer access_token from the login response body. */
export async function getAuthToken(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const response = await loginUser(request, email, password);
  const body = await response.json();
  return body.access_token;
}

/**
 * Returns the cookie string from the login Set-Cookie header.
 * Format: "access_token=<jwt>"
 * Pass this as the `auth` argument to any helper below.
 */
export async function getAuthCookie(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const response = await loginUser(request, email, password);
  const cookie = response
    .headersArray()
    .filter(h => h.name.toLowerCase() === 'set-cookie')
    .map(h => h.value.split(';')[0].trim())
    .join('; ');
  if (!cookie) {
    throw new Error('getAuthCookie: no Set-Cookie header in login response');
  }
  return cookie;
}

// ---------------------------------------------------------------------------
// Job helpers
// ---------------------------------------------------------------------------

export async function createJob(
  request: APIRequestContext,
  auth: string,
  jobData: object,
) {
  return request.post(`${API_URL}/jobs`, {
    headers: buildAuthHeader(auth),
    data: jobData,
  });
}

export async function getJobs(
  request: APIRequestContext,
  auth: string,
  page?: number,
  page_size?: number,
) {
  const params: Record<string, string> = {};
  if (page !== undefined) params['page'] = String(page);
  if (page_size !== undefined) params['page_size'] = String(page_size);
  return request.get(`${API_URL}/jobs`, {
    headers: buildAuthHeader(auth),
    params,
  });
}

export async function getJobById(
  request: APIRequestContext,
  auth: string,
  jobId: string,
) {
  return request.get(`${API_URL}/jobs/${jobId}`, {
    headers: buildAuthHeader(auth),
  });
}

export async function updateJob(
  request: APIRequestContext,
  auth: string,
  jobId: string,
  jobData: object,
) {
  return request.put(`${API_URL}/jobs/${jobId}`, {
    headers: buildAuthHeader(auth),
    data: jobData,
  });
}

export async function deleteJob(
  request: APIRequestContext,
  auth: string,
  jobId: string,
) {
  return request.delete(`${API_URL}/jobs/${jobId}`, {
    headers: buildAuthHeader(auth),
  });
}

// ---------------------------------------------------------------------------
// Interview round helpers
// ---------------------------------------------------------------------------

export async function createInterviewRound(
  request: APIRequestContext,
  auth: string,
  jobId: string,
  roundData: object,
) {
  return request.post(`${API_URL}/jobs/${jobId}/interviews`, {
    headers: buildAuthHeader(auth),
    data: roundData,
  });
}

export async function getInterviewRounds(
  request: APIRequestContext,
  auth: string,
  jobId: string,
) {
  return request.get(`${API_URL}/jobs/${jobId}/interviews`, {
    headers: buildAuthHeader(auth),
  });
}
