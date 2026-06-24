export async function fetchAutopilotDescribeShoutout(
  stage: string,
): Promise<string | null> {
  try {
    const res = await fetch('/api/autopilot/shoutout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { ok?: boolean; text?: string };
    return data.ok && data.text?.trim() ? data.text.trim() : null;
  } catch {
    return null;
  }
}
