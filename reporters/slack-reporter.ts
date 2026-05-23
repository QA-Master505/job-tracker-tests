import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import { sendSlackNotification, sendCiCdNotification } from '../helpers/slack-notifier';
import type { FailureDetail } from '../helpers/slack-notifier';

class SlackReporter implements Reporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private failures: FailureDetail[] = [];
  private startTime = 0;

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed') {
      this.passed++;
    } else if (result.status === 'skipped') {
      this.skipped++;
    } else {
      // failed | timedOut | interrupted
      this.failed++;
      const rawMessage =
        result.error?.message ?? result.errors[0]?.message ?? 'Unknown error';
      this.failures.push({
        testName: test.titlePath().join(' > '),
        // strip ANSI escape codes that appear in Playwright error output
        errorMessage: rawMessage.replace(/\[[0-9;]*m/g, '').trim(),
      });
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    const durationMs = result.duration ?? Date.now() - this.startTime;
    const total = this.passed + this.failed + this.skipped;

    const actor = process.env.GITHUB_ACTOR ?? 'local';
    const branch = process.env.GITHUB_REF_NAME ?? 'local';
    const runId = process.env.GITHUB_RUN_ID;
    const repository = process.env.GITHUB_REPOSITORY;
    const runUrl =
      runId && repository
        ? `https://github.com/${repository}/actions/runs/${runId}`
        : '';

    await sendSlackNotification({
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      total,
      durationMs,
      branch,
      actor,
      runUrl,
      failures: this.failures,
    });

    await sendCiCdNotification({
      workflowName: process.env.GITHUB_WORKFLOW ?? 'Playwright Tests',
      status: this.failed > 0 ? 'failure' : 'success',
      branch,
      actor,
      durationMs,
      runUrl,
    });
  }
}

export default SlackReporter;
