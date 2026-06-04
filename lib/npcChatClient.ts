import { NPC_TYPING_MS } from '@/lib/npcChat';

export type NpcChatRequest = {
  characterId: string;
  playerName?: string;
  message?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  isGreeting?: boolean;
  cinemaNowPlaying?: string | null;
  concertNowPlaying?: string | null;
};

export async function fetchNpcReply(
  body: NpcChatRequest,
  signal: AbortSignal,
): Promise<string | undefined> {
  const res = await fetch('/api/chat/npc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json();
  return data.reply as string | undefined;
}

/** Show typing state, wait at least NPC_TYPING_MS, then reveal the reply. */
export async function fetchNpcReplyWithTyping(
  body: NpcChatRequest,
  signal: AbortSignal,
  onTyping: () => void,
  onReply: (reply: string) => void,
): Promise<void> {
  onTyping();
  const start = Date.now();

  try {
    const reply = await fetchNpcReply(body, signal);
    if (signal.aborted) return;

    const remaining = NPC_TYPING_MS - (Date.now() - start);
    if (remaining > 0) {
      await new Promise<void>((resolve, reject) => {
        const id = setTimeout(resolve, remaining);
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(id);
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true },
        );
      });
    }

    if (signal.aborted || !reply) return;
    onReply(reply);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    throw err;
  }
}
