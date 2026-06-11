import { sanitizeNpcLine } from '@/lib/messageFilter';
import { evaluateFestieChatGate } from '@/lib/festie/chatGate';
import {
  appendFestieConversation,
  getFestieById,
  toFestiePublic,
  touchFestieLastChat,
} from '@/lib/festie/db';
import { festieIdFromNpcId } from '@/lib/festie/toCharacterDef';
import {
  buildFestieChatMessages,
  buildFestieGreetingMessages,
  festieChatTurnLimitReached,
  pickFestieFallbackGreeting,
  pickFestieFallbackReply,
} from '@/lib/festie/chat';
import { getMergedSeedPools } from '@/lib/seeds/db';
import { pickSeedForFestie } from '@/lib/seeds/pick';
import { NPC_CHAT_MODEL, type ChatTurn } from '@/lib/npcChat';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

export type FestieChatRequest = {
  characterId: string;
  playerName?: string;
  message?: string;
  history?: ChatTurn[];
  isGreeting?: boolean;
  cinemaNowPlaying?: string | null;
  concertNowPlaying?: string | null;
  conversationId?: string | null;
};

export async function handleFestieNpcChat(
  request: Request,
  body: FestieChatRequest,
): Promise<Response> {
  if (!getDb()) {
    return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const festieId = festieIdFromNpcId(body.characterId);
  if (!festieId) {
    return Response.json({ error: 'Invalid festie id' }, { status: 400 });
  }

  const festieRow = await getFestieById(festieId);
  if (!festieRow) {
    return Response.json({ error: 'Festie not found' }, { status: 404 });
  }

  const festie = toFestiePublic(festieRow);
  if (festie.tier === 'gone') {
    return Response.json({ error: 'Festie is no longer active' }, { status: 410 });
  }

  const playerName = body.playerName?.trim() || 'friend';
  const history = body.history ?? [];
  const isGreeting = Boolean(body.isGreeting);

  if (!isGreeting && !body.message?.trim()) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  if (!isGreeting && festieChatTurnLimitReached(history)) {
    return Response.json({
      reply: pickFestieFallbackReply(festie),
      conversationId: body.conversationId ?? null,
      limitReached: true,
    });
  }

  const gate = await evaluateFestieChatGate(festieRow);
  if (!gate.useLlm) {
    const reply = gate.cannedReply
      ?? (isGreeting ? pickFestieFallbackGreeting(festie) : pickFestieFallbackReply(festie));
    return Response.json({
      reply,
      conversationId: body.conversationId ?? null,
    });
  }

  const pools = await getMergedSeedPools(festie.stage_slug);
  const conversationSeed = pickSeedForFestie(festie, pools);

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    const reply = isGreeting
      ? pickFestieFallbackGreeting(festie)
      : pickFestieFallbackReply(festie);
    const conversationId = await logExchange(
      festieId,
      userIdFromRequest(request),
      body.conversationId ?? null,
      isGreeting,
      body.message?.trim() ?? null,
      reply,
    );
    await touchFestieLastChat(festieId);
    return Response.json({ reply, conversationId });
  }

  const messages = isGreeting
    ? buildFestieGreetingMessages(
        festie,
        playerName,
        body.cinemaNowPlaying,
        body.concertNowPlaying,
        conversationSeed,
      )
    : buildFestieChatMessages(
        festie,
        playerName,
        body.message!.trim(),
        history,
        body.cinemaNowPlaying,
        body.concertNowPlaying,
        conversationSeed,
      );

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NPC_CHAT_MODEL,
        messages,
        max_tokens: 55,
        temperature: 0.9,
      }),
    });

    let reply: string;
    if (!res.ok) {
      console.error('[festie chat] OpenAI error', res.status, await res.text());
      reply = isGreeting
        ? pickFestieFallbackGreeting(festie)
        : pickFestieFallbackReply(festie);
    } else {
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      reply = raw ? sanitizeNpcLine(raw) ?? pickFestieFallbackReply(festie)
        : (isGreeting ? pickFestieFallbackGreeting(festie) : pickFestieFallbackReply(festie));
    }

    const conversationId = await logExchange(
      festieId,
      userIdFromRequest(request),
      body.conversationId ?? null,
      isGreeting,
      body.message?.trim() ?? null,
      reply,
    );
    await touchFestieLastChat(festieId);

    return Response.json({ reply, conversationId });
  } catch (err) {
    console.error('[festie chat] failed', err);
    const reply = isGreeting
      ? pickFestieFallbackGreeting(festie)
      : pickFestieFallbackReply(festie);
    return Response.json({ reply, conversationId: body.conversationId ?? null });
  }
}

async function logExchange(
  festieId: string,
  playerId: string | null,
  conversationId: string | null,
  isGreeting: boolean,
  userMessage: string | null,
  assistantMessage: string,
): Promise<string> {
  const now = new Date().toISOString();
  const entries: { role: 'user' | 'assistant'; content: string; at: string }[] = [];

  if (isGreeting) {
    entries.push({ role: 'assistant', content: assistantMessage, at: now });
  } else if (userMessage) {
    entries.push({ role: 'user', content: userMessage, at: now });
    entries.push({ role: 'assistant', content: assistantMessage, at: now });
  }

  if (entries.length === 0) return conversationId ?? '';

  return appendFestieConversation(festieId, playerId, conversationId, entries);
}
