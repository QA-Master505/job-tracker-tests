# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/user-journey.spec.ts >> User Journey E2E >> should register a new user and login successfully
- Location: tests/e2e/user-journey.spec.ts:35:7

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:8000
Call log:
  - → POST http://localhost:8000/auth/register
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.96 Safari/537.36
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 100

```