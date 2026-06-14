import { isChatterMuted } from '@/lib/chatterMuted';
import type { EaselPaintingChatContext } from '@/lib/easel/chatContext';
import { chatterDebugFetchHeaders } from '@/lib/chatterDebug';
import { ilog, iwarn, ierror, internalDebugFetchHeaders } from '@/lib/internalDebug';
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
): Promise<{ reply?: string; conversationId?: string; error?: string } | undefined> {
  if (isChatterMuted()) {
    ilog('[npc-chat] skipped — chatter muted (?mute=true)');
    return undefined;
  }

  let res: Response;
  try {
    res = await fetch('/api/chat/npc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...internalDebugFetchHeaders(),
        ...chatterDebugFetchHeaders(),
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return undefined;
    ierror('[npc-chat] fetch failed', { characterId: body.characterId, err });
    return undefined;
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json() as Record<string, unknown>;
  } catch (err) {
    ierror('[npc-chat] invalid JSON response', res.status, err);
    return undefined;
  }

  if (!res.ok) {
    ierror('[npc-chat] API error', {
      status: res.status,
      characterId: body.characterId,
      error: data.error ?? data,
    });
    return undefined;
  }

  const reply = typeof data.reply === 'string' ? data.reply : undefined;
  if (!reply?.trim()) {
    iwarn('[npc-chat] API ok but empty reply — check OpenAI / festie LLM logs', {
      characterId: body.characterId,
      isGreeting: body.isGreeting,
      data,
    });
  }

  return {
    reply,
    conversationId: typeof data.conversationId === 'string' ? data.conversationId : undefined,
    error: typeof data.error === 'string' ? data.error : undefined,
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

    if (signal.aborted) return;

    if (!result?.reply?.trim()) {
      iwarn('[npc-chat] no reply to show', {
        characterId: body.characterId,
        message: body.message?.slice(0, 80),
        apiError: result?.error,
      });
      return;
    }

    onReply({
      reply: result.reply,
      conversationId: result.conversationId,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    ierror('[npc-chat] client failed', { characterId: body.characterId, err });
    throw err;
  }
}
