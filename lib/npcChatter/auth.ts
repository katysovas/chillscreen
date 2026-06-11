/** Shared secret between PartyKit and /api/npc-chatter. */
export function verifyChatterRequest(req: Request): Response | null {
  const secret = process.env.NPC_CHATTER_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return Response.json({ error: 'Service unavailable' }, { status: 503 });
    }
    return null;
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function chatterAuthHeader(secret: string | undefined): Record<string, string> {
  if (!secret?.trim()) return {};
  return { Authorization: `Bearer ${secret.trim()}` };
}
