import { fetchBitcoinUsdSnapshot } from '@/lib/bitcoinPrice';
import type { EaselPaintingChatContext } from '@/lib/easel/chatContext';
import { handleFestieNpcChat } from '@/lib/festie/chatHandler';
import { isFestieNpcId } from '@/lib/festie/toCharacterDef';
import { sanitizeNpcLine } from '@/lib/messageFilter';
import {
  buildChatMessages,
  buildGreetingMessages,
  getCharacterById,
  NPC_CHAT_MODEL,
  pickFallbackGreeting,
  pickFallbackReply,
  type ChatTurn,
} from '@/lib/npcChat';

type RequestBody = {
  characterId: string;
  playerName?: string;
  message?: string;
  history?: ChatTurn[];
  isGreeting?: boolean;
  cinemaNowPlaying?: string | null;
  concertNowPlaying?: string | null;
  easelPainting?: EaselPaintingChatContext | null;
  conversationId?: string | null;
};

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { characterId, history = [], isGreeting = false, cinemaNowPlaying, concertNowPlaying, easelPainting } = body;
  const playerName = body.playerName?.trim() || 'friend';

  if (!characterId) {
    return Response.json({ error: 'characterId is required' }, { status: 400 });
  }

  if (!isGreeting && !body.message?.trim()) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  if (isFestieNpcId(characterId)) {
    return handleFestieNpcChat(req, body);
  }

  const character = getCharacterById(characterId);
  if (!character) {
    return Response.json({ error: 'Unknown character' }, { status: 404 });
  }

  const bitcoinSnapshot =
    character.id === 'satosh' ? await fetchBitcoinUsdSnapshot() : null;

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return Response.json({
      reply: isGreeting
        ? pickFallbackGreeting(character, bitcoinSnapshot)
        : pickFallbackReply(character, bitcoinSnapshot),
    });
  }

  const messages = isGreeting
    ? buildGreetingMessages(
        character,
        playerName,
        cinemaNowPlaying,
        concertNowPlaying,
        bitcoinSnapshot,
        easelPainting,
      )
    : buildChatMessages(
        character,
        playerName,
        body.message!.trim(),
        history,
        cinemaNowPlaying,
        concertNowPlaying,
        bitcoinSnapshot,
        easelPainting,
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

    if (!res.ok) {
      console.error('OpenAI error', res.status, await res.text());
      return Response.json({
        reply: isGreeting
          ? pickFallbackGreeting(character, bitcoinSnapshot)
          : pickFallbackReply(character, bitcoinSnapshot),
      });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    const reply = raw ? sanitizeNpcLine(raw) : null;

    if (!reply) {
      return Response.json({
        reply: isGreeting
          ? pickFallbackGreeting(character, bitcoinSnapshot)
          : pickFallbackReply(character, bitcoinSnapshot),
      });
    }

    return Response.json({ reply });
  } catch (err) {
    console.error('NPC chat failed', err);
    return Response.json({
      reply: isGreeting
        ? pickFallbackGreeting(character, bitcoinSnapshot)
        : pickFallbackReply(character, bitcoinSnapshot),
    });
  }
}
