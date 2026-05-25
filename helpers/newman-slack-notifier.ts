export interface NewmanSlackPayload {
  total: number;
  failed: number;
  durationMs: number;
  branch: string;
  actor: string;
  runUrl: string;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${seconds}s`;
}

export async function sendNewmanSlackNotification(payload: NewmanSlackPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[NewmanSlack] SLACK_WEBHOOK_URL not set — skipping');
    return;
  }

  const hasFailed = payload.failed > 0;
  const color = hasFailed ? '#e01e5a' : '#2eb886';
  const statusEmoji = hasFailed ? '❌' : '✅';
  const headerText = hasFailed
    ? `Postman Tests Failed — ${payload.failed} failure${payload.failed !== 1 ? 's' : ''}`
    : 'Postman Tests Passed';

  const fields: object[] = [
    { type: 'mrkdwn', text: `*Total:* ${payload.total}` },
    { type: 'mrkdwn', text: `*Failed:* ${payload.failed}` },
    { type: 'mrkdwn', text: `*Duration:* ${formatDuration(payload.durationMs)}` },
    { type: 'mrkdwn', text: `*Branch:* \`${payload.branch}\`` },
    { type: 'mrkdwn', text: `*Triggered by:* ${payload.actor}` },
  ];

  if (payload.runUrl) {
    fields.push({ type: 'mrkdwn', text: `*Run:* <${payload.runUrl}|View on GitHub>` });
  }

  const blocks: object[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${statusEmoji} ${headerText}`, emoji: true },
    },
    { type: 'section', fields },
  ];

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachments: [{ color, blocks }] }),
    });
    if (!response.ok) {
      console.warn(`[NewmanSlack] Webhook returned ${response.status}: ${await response.text()}`);
    }
  } catch (err) {
    console.warn('[NewmanSlack] Failed to send notification:', err);
  }
}
