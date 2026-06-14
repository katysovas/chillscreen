import { ierror, iwarn } from '@/lib/internalDebug';
import { completeFestieChat } from '@/lib/festie/completeChat';
import { evaluateFestieChatGate } from '@/lib/festie/chatGate';
import {
  appendFestieConversation,
  getFestieById,
  toFestiePublic,
  touchFestieLastChat,
} from '@/lib/festie/db';
import {
  FESTIE_EVENT_TYPES,
  logFestieEvent,
  type FestieChatEventPayload,
} from '@/lib/festie/events';
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
import type { ChatTurn } from '@/lib/npcChat';
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
    recordChatEvent(festieId, {
      playerName,
      playerId: userIdFromRequest(request),
      isGreeting,
      userMessage: body.message?.trim() ?? null,
      reply,
      conversationId: body.conversationId ?? null,
      llm: false,
    });
    return Response.json({
      reply,
      conversationId: body.conversationId ?? null,
    });
  }

  const pools = await getMergedSeedPools(festie.stage_slug);
  const conversationSeed = pickSeedForFestie(festie, pools);

  const hasLlmKey = Boolean(
    process.env.OPENROUTER_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim(),
  );
  if (!hasLlmKey) {
    iwarn('[festie chat] no OPENROUTER_API_KEY or OPENAI_API_KEY — fallback reply', festieId);
    const reply = isGreeting
      ? pickFestieFallbackGreeting(festie)
      : pickFestieFallbackReply(festie);
    const playerId = userIdFromRequest(request);
    const conversationId = await logExchange(
      festieId,
      playerId,
      body.conversationId ?? null,
      isGreeting,
      body.message?.trim() ?? null,
      reply,
    );
    await touchFestieLastChat(festieId);
    recordChatEvent(festieId, {
      playerName,
      playerId,
      isGreeting,
      userMessage: body.message?.trim() ?? null,
      reply,
      conversationId,
      llm: false,
    });
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
    const llmReply = await completeFestieChat(festieRow.llm_provider, messages);
    if (!llmReply) {
      iwarn('[festie chat] LLM returned empty — fallback reply', {
        festieId,
        provider: festieRow.llm_provider,
        isGreeting,
      });
    }
    const reply = llmReply
      ?? (isGreeting ? pickFestieFallbackGreeting(festie) : pickFestieFallbackReply(festie));

    const playerId = userIdFromRequest(request);
    const conversationId = await logExchange(
      festieId,
      playerId,
      body.conversationId ?? null,
      isGreeting,
      body.message?.trim() ?? null,
      reply,
    );
    await touchFestieLastChat(festieId);
    recordChatEvent(festieId, {
      playerName,
      playerId,
      isGreeting,
      userMessage: body.message?.trim() ?? null,
      reply,
      conversationId,
      llm: true,
    });

    return Response.json({ reply, conversationId });
  } catch (err) {
    ierror('[festie chat] failed', err);
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

function recordChatEvent(festieId: string, payload: FestieChatEventPayload): void {
  logFestieEvent(festieId, FESTIE_EVENT_TYPES.CHAT, payload);
}
