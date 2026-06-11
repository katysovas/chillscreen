import { generatePairConvo, generateSingleReply } from '@/lib/npcChatter/generate';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import { clampLineBudget, clampTriggerText, sanitizeRecentChat } from '@/lib/npcChatter/validate';
import { isChatterNpc } from '@/lib/npcRoster.server';
import { HOUSE_MODEL_DEFAULT } from '@/lib/npcChatter/constants';

/** Pair convo = up to 7 sequential LLM calls (~8s each). */
export const maxDuration = 60;

type PairBody = {
  mode?: 'pair';
  stage: string;
  npcA: string;
  npcB: string;
  seed: string | null;
  lineBudget: number;
  recentChat?: unknown;
  streamTitle?: string | null;
  channelName?: string;
};

type ReplyBody = {
  mode: 'reply';
  stage: string;
  npc: string;
  triggerText: string;
  recentChat?: unknown;
  streamTitle?: string | null;
  channelName?: string;
};

export async function POST(req: Request) {
  const denied = verifyChatterRequest(req);
  if (denied) return denied;

  let body: PairBody | ReplyBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const houseModel = process.env.HOUSE_MODEL?.trim() || HOUSE_MODEL_DEFAULT;
  const recentChat = sanitizeRecentChat(body.recentChat);
  const streamTitle = typeof body.streamTitle === 'string' ? body.streamTitle.slice(0, 200) : null;
  const channelName = typeof body.channelName === 'string'
    ? body.channelName.slice(0, 80)
    : 'the stage';
  const stage = typeof body.stage === 'string' ? body.stage.slice(0, 64) : '';

  if (body.mode === 'reply') {
    const npc = body.npc?.trim();
    const triggerText = clampTriggerText(body.triggerText ?? '');
    if (!npc || !triggerText || !isChatterNpc(npc)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
    const line = await generateSingleReply({
      stage,
      npc,
      triggerText,
      recentChat,
      streamTitle,
      channelName,
      apiKey,
      houseModel,
    });
    if (!line) {
      return Response.json({ error: 'Generation failed' }, { status: 502 });
    }
    return Response.json({ lines: [line] });
  }

  const npcA = body.npcA?.trim();
  const npcB = body.npcB?.trim();
  const lineBudget = clampLineBudget(body.lineBudget);
  if (!stage || !npcA || !npcB || !isChatterNpc(npcA) || !isChatterNpc(npcB) || npcA === npcB) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const seed = typeof body.seed === 'string' ? body.seed.slice(0, 300) : null;

  const lines = await generatePairConvo({
    stage,
    npcA,
    npcB,
    seed,
    lineBudget,
    recentChat,
    streamTitle,
    channelName,
    apiKey,
    houseModel,
  });

  if (lines.length < 2) {
    return Response.json({ error: 'Generation failed' }, { status: 502 });
  }

  return Response.json({ lines });
}
