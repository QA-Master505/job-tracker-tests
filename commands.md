# Job Tracker Tests — Command Reference

## Quick Start
Make sure both servers are running before tests:
- Backend: `cd ../job-tracker-backend && make run`
- Frontend: `cd ../job-tracker-frontend && make dev`

## Running Tests

| Command | Description |
|---------|-------------|
| `make test` | Run all tests (2 workers) |
| `make test-api` | Run API tests only |
| `make test-ui` | Run UI tests only |
| `make test-headed` | Run with visible browser |
| `make test-debug` | Run in debug mode |
| `make test-chrome` | Run on Chrome only |
| `make test-firefox` | Run on Firefox only |
| `make test-file FILE=path` | Run specific test file |
| `make test-fast` | Run with 1 worker (safer) |

## Reports

| Command | Description |
|---------|-------------|
| `make report` | Open HTML report |
| `make report-junit` | View JUnit XML report |

## Recording

| Command | Description |
|---------|-------------|
| `make codegen` | Record new tests visually |
| `make codegen-auth` | Record auth flow |
| `make codegen-jobs` | Record jobs flow |

## Playwright CLI

| Command | Description |
|---------|-------------|
| `make cli-open` | Open browser with CLI |
| `make cli-show` | Visual dashboard |
| `make cli-snapshot` | Take page snapshot |
| `make cli-screenshot` | Take screenshot |

## Setup

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make install-browsers` | Install all browsers |
| `make install-skills` | Install CLI skills |

## Debugging

| Command | Description |
|---------|-------------|
| `make debug-login` | Debug login page |
| `make debug-dashboard` | Debug dashboard page |
| `make debug-jobs` | Debug jobs flow |
