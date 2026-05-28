export const BDD_CONFIG = {
  API_URL: process.env.API_URL ||
    'https://job-tracker-backend-production-7acf.up.railway.app',
  BASE_URL: process.env.BASE_URL ||
    'https://job-tracker-frontend-green-sigma.vercel.app',
  TEST_PASSWORD: 'Test123!',
  TEST_JOB: {
    company_name: 'BDD Test Company',
    position: 'QA Engineer',
    status: 'applied',
  },
  DEFAULT_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 20000,
  SLOW_MO: 800,
};
