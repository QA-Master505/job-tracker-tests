export interface FailureDetail {
  testName: string;
  errorMessage: string;
}

export interface SlackNotificationPayload {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  durationMs: number;
  branch: string;
  actor: string;
  runUrl: string;
  failures: FailureDetail[];
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${seconds}s`;
}

export async function sendSlackNotification(payload: SlackNotificationPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[SlackReporter] SLACK_WEBHOOK_URL not set — skipping Slack notification');
    return;
  }

  const hasFailed = payload.failed > 0;
  const color = hasFailed ? '#e01e5a' : '#2eb886';
  const statusEmoji = hasFailed ? '❌' : '✅';
  const statusText = hasFailed
    ? `Playwright Tests Failed — ${payload.failed} failure${payload.failed !== 1 ? 's' : ''}`
    : 'Playwright Tests Passed';

  const statsFields = [
    { type: 'mrkdwn', text: `*Passed:* ${payload.passed}` },
    { type: 'mrkdwn', text: `*Failed:* ${payload.failed}` },
    { type: 'mrkdwn', text: `*Skipped:* ${payload.skipped}` },
    { type: 'mrkdwn', text: `*Total:* ${payload.total}` },
    { type: 'mrkdwn', text: `*Duration:* ${formatDuration(payload.durationMs)}` },
    { type: 'mrkdwn', text: `*Branch:* \`${payload.branch}\`` },
  ];

  const metaFields: object[] = [
    { type: 'mrkdwn', text: `*Triggered by:* ${payload.actor}` },
  ];
  if (payload.runUrl) {
    metaFields.push({ type: 'mrkdwn', text: `*Run:* <${payload.runUrl}|View on GitHub>` });
  }

  const blocks: object[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${statusEmoji} ${statusText}`, emoji: true },
    },
    { type: 'section', fields: statsFields },
    { type: 'section', fields: metaFields },
  ];

  if (payload.failures.length > 0) {
    const failureLines = payload.failures
      .slice(0, 5)
      .map(({ testName, errorMessage }) => {
        const truncated =
          errorMessage.length > 200 ? `${errorMessage.slice(0, 200)}…` : errorMessage;
        return `• *${testName}*\n  \`${truncated}\``;
      })
      .join('\n');

    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Failed Tests:*\n${failureLines}` },
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachments: [{ color, blocks }] }),
    });
    if (!response.ok) {
      console.warn(`[SlackReporter] Webhook returned ${response.status}: ${await response.text()}`);
    }
  } catch (err) {
    console.warn('[SlackReporter] Failed to send Slack notification:', err);
  }
}
