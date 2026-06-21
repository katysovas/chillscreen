export async function purgeChatterSenderInRoom(
  roomId: string,
  sender: string,
): Promise<number> {
  const res = await fetch('/api/moderation/purge-chatter', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, sender }),
  });
  const data = await res.json() as { error?: string; purged?: number };
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not purge chatter');
  }
  return data.purged ?? 0;
}
