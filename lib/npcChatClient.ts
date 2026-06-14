import { isChatterMuted } from '@/lib/chatterMuted';
import type { EaselPaintingChatContext } from '@/lib/easel/chatContext';
import { NPC_TYPING_MS } from '@/lib/npcChat';

export type NpcChatRequest = {
  characterId: string;
  playerName?: string;
  message?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  isGreeting?: boolean;
  cinemaNowPlaying?: string | null;
  concertNowPlaying?: string | null;
  /** Active easel painting — informs replies about the canvas. */
  easelPainting?: EaselPaintingChatContext | null;
  /** Festie 1:1 chats — persisted in festie_conversations. */
  conversationId?: string | null;
};

export async function fetchNpcReply(
  body: NpcChatRequest,
  signal: AbortSignal,
): Promise<{ reply?: string; conversationId?: string } | undefined> {
  if (isChatterMuted()) return undefined;
  const res = await fetch('/api/chat/npc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json();
  return {
    reply: data.reply as string | undefined,
    conversationId: data.conversationId as string | undefined,
  };
}

/** Show typing state, wait at least NPC_TYPING_MS, then reveal the reply. */
export type NpcChatReply = {
  reply: string;
  conversationId?: string;
};

export async function fetchNpcReplyWithTyping(
  body: NpcChatRequest,
  signal: AbortSignal,
  onTyping: () => void,
  onReply: (result: NpcChatReply) => void,
): Promise<void> {
  onTyping();
  const start = Date.now();

  try {
    const result = await fetchNpcReply(body, signal);
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

    if (signal.aborted || !result?.reply) return;
    onReply({
      reply: result.reply,
      conversationId: result.conversationId,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    throw err;
  }
}
