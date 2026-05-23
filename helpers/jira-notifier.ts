import type { FailureDetail } from './slack-notifier';

export async function createJiraBug(
  failure: FailureDetail,
  runUrl: string,
): Promise<string | null> {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!baseUrl || !email || !apiToken || !projectKey) {
    console.warn('[JiraReporter] Jira env vars not set — skipping bug creation');
    return null;
  }

  const branch = process.env.GITHUB_REF_NAME ?? 'local';
  if (branch !== 'main') {
    console.warn(`[JiraReporter] Branch "${branch}" — skipping Jira bug creation (main only)`);
    return null;
  }

  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  const body = {
    fields: {
      project: { key: projectKey },
      summary: `🐛 [Auto] Failed test: ${failure.testName}`,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Error:', marks: [{ type: 'strong' }] }],
          },
          {
            type: 'codeBlock',
            attrs: { language: 'text' },
            content: [{ type: 'text', text: failure.errorMessage }],
          },
          ...(runUrl
            ? [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'GitHub Actions Run: ' },
                    { type: 'text', text: runUrl, marks: [{ type: 'link', attrs: { href: runUrl } }] },
                  ],
                },
              ]
            : []),
        ],
      },
      issuetype: { name: 'Bug' },
      priority: { name: 'High' },
    },
  };

  try {
    const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.warn(`[JiraReporter] Failed to create bug (${response.status}): ${await response.text()}`);
      return null;
    }
    const data = (await response.json()) as { key: string };
    console.log(`[JiraReporter] Created: ${baseUrl}/browse/${data.key}`);
    return data.key;
  } catch (err) {
    console.warn('[JiraReporter] Error creating Jira bug:', err);
    return null;
  }
}
