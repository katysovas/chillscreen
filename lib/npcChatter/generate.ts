import { ierror, ilog, iwarn } from '@/lib/internalDebug';
import { activeDemoSeed } from '@/lib/npcChatter/demoSeed';
import { isDuplicateNpcChatterText, roomLinesForNpcDedup } from '@/lib/npcChatter/dedup';
import { sanitizeNpcLine } from '@/lib/messageFilter';
import { resolveNpcRosterEntry } from '@/lib/npcRoster.server';
import {
  clampFestieDescribeShoutout,
  fallbackFestieDescribeShoutout,
  buildFestieDescribeShoutoutPrompt,
  FESTIE_SHOUTOUT_MAX_TOKENS,
} from '@/lib/festie/describeShoutouts';
import type { RoomChatLine } from './prompts';
import { buildLineSystemPrompt, buildSingleReplySystemPrompt, buildStageChatterSystemPrompt } from './prompts';
import { pickStageChatterIntent, pickLineLengthHint, type StageChatterIntent } from './constants';
import { resolveModel } from './models';
import { completeNpcLine } from './completeLine';
import type { ChatMessage } from './openrouter';
import { pickOpeningStance } from './stances';

export type NpcChatterLine = { npc: string; text: string };

export type PairConvoRequest = {
  stage: string;
  npcA: string;
  npcB: string;
  seed: string | null;
  lineBudget: number;
  recentChat: RoomChatLine[];
  streamTitle: string | null;
  channelName: string;
  houseModel: string;
  /** Broadcast each line as soon as it is generated (first line = no upstream wait). */
  onLine?: (line: NpcChatterLine) => void | Promise<void>;
};

export type SingleReplyRequest = {
  stage: string;
  npc: string;
  triggerText: string;
  recentChat: RoomChatLine[];
  streamTitle: string | null;
  channelName: string;
  houseModel: string;
};

export async function generatePairConvo(req: PairConvoRequest): Promise<NpcChatterLine[]> {
  const npcA = await resolveNpcRosterEntry(req.npcA);
  const npcB = await resolveNpcRosterEntry(req.npcB);
  if (!npcA || !npcB) return [];

  const lines: NpcChatterLine[] = [];
  const transcript: { npc: string; text: string }[] = [];
  const openingStance = pickOpeningStance();

  for (let i = 0; i < req.lineBudget; i++) {
    const isA = i % 2 === 0;
    const speaker = isA ? npcA : npcB;
    const isOpener = i === 0;
    const isCloser = i === req.lineBudget - 1;
    const seed = isA && isOpener ? (activeDemoSeed() ?? req.seed) : null;

    const system = buildLineSystemPrompt({
      npc: speaker,
      stage: req.stage,
      streamTitle: req.streamTitle,
      channelName: req.channelName,
      recentChat: req.recentChat,
      transcript,
      isOpener,
      isCloser,
      seed,
      isResponderB: !isA,
      openingStance: isA && isOpener ? openingStance : undefined,
      lengthHint: pickLineLengthHint(),
    });

    const messages: ChatMessage[] = [{ role: 'system', content: system }];
    if (transcript.length > 0) {
      messages.push({
        role: 'user',
        content: 'Continue the exchange with your next line.',
      });
    }

    const model = resolveModel(speaker.modelId, req.houseModel);
    if (isA && isOpener) {
      ilog(`[npc-chatter] opener stance: ${openingStance}`);
    }
    ilog(`[npc-chatter] line ${i + 1}/${req.lineBudget} ${speaker.id} → ${model}`);
    const dedupLines = roomLinesForNpcDedup(speaker.id, req.recentChat, transcript);
    let raw: string | null = null;
    let text: string | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      raw = await completeNpcLine(model, messages, req.houseModel);
      text = raw ? sanitizeNpcLine(raw) : null;
      if (!text) break;
      if (!isDuplicateNpcChatterText(speaker.id, text, dedupLines)) break;
      iwarn('[npc-chatter] duplicate pair line skipped, retrying', {
        speaker: speaker.id,
        text: text.slice(0, 80),
        attempt,
      });
      text = null;
    }
    if (!text) {
      ierror('[npc-chatter] pair line failed', {
        speaker: speaker.id,
        model,
        line: i + 1,
        budget: req.lineBudget,
      });
      break;
    }

    const line = { npc: speaker.id, text };
    lines.push(line);
    transcript.push(line);
    if (req.onLine) await req.onLine(line);
  }

  return lines;
}

export type StageChatterRequest = {
  stage: string;
  npc: string;
  recentChat: RoomChatLine[];
  streamTitle: string | null;
  channelName: string;
  houseModel: string;
  intent?: StageChatterIntent;
};

export type FestieShoutoutRequest = {
  mode: 'festie-shoutout';
  stage: string;
  npc: string;
  houseModel: string;
};

export async function generateFestieDescribeShoutout(
  req: FestieShoutoutRequest,
): Promise<NpcChatterLine | null> {
  const npc = await resolveNpcRosterEntry(req.npc);
  if (!npc?.describeNotes?.trim()) return null;
  if (!npc.autopilotActive && !npc.ownerOnStage) return null;

  const system = buildFestieDescribeShoutoutPrompt({
    festieName: npc.displayName,
    describeNotes: npc.describeNotes,
    stage: req.stage,
    autopilot: Boolean(npc.autopilotActive),
  });

  const model = resolveModel(npc.modelId, req.houseModel);
  const raw = await completeNpcLine(
    model,
    [{ role: 'system', content: system }],
    req.houseModel,
    FESTIE_SHOUTOUT_MAX_TOKENS,
  );
  const text = raw
    ? clampFestieDescribeShoutout(raw)
    : fallbackFestieDescribeShoutout(npc.describeNotes);
  if (!text) return null;
  return { npc: npc.id, text };
}

export async function generateStageChatterReply(req: StageChatterRequest): Promise<NpcChatterLine | null> {
  const npc = await resolveNpcRosterEntry(req.npc);
  if (!npc) return null;

  const intent = req.intent ?? pickStageChatterIntent();
  const system = buildStageChatterSystemPrompt({
    npc,
    stage: req.stage,
    streamTitle: req.streamTitle,
    channelName: req.channelName,
    recentChat: req.recentChat,
    intent,
    lengthHint: pickLineLengthHint(),
  });

  const model = resolveModel(npc.modelId, req.houseModel);
  const dedupLines = roomLinesForNpcDedup(npc.id, req.recentChat);
  let text: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await completeNpcLine(
      model,
      [{ role: 'system', content: system }],
      req.houseModel,
    );
    const cleaned = raw ? sanitizeNpcLine(raw) : null;
    if (!cleaned) break;
    if (!isDuplicateNpcChatterText(npc.id, cleaned, dedupLines)) {
      text = cleaned;
      break;
    }
    iwarn('[npc-chatter] duplicate stage reply skipped, retrying', {
      npc: req.npc,
      text: cleaned.slice(0, 80),
      attempt,
    });
  }
  if (!text) {
    ierror('[npc-chatter] stage reply generation failed', { npc: req.npc, model });
    return null;
  }
  return { npc: npc.id, text };
}

export async function generateSingleReply(req: SingleReplyRequest): Promise<NpcChatterLine | null> {
  const npc = await resolveNpcRosterEntry(req.npc);
  if (!npc) return null;

  const system = buildSingleReplySystemPrompt({
    npc,
    stage: req.stage,
    streamTitle: req.streamTitle,
    channelName: req.channelName,
    recentChat: req.recentChat,
    triggerText: req.triggerText,
    lengthHint: pickLineLengthHint(),
  });

  const model = resolveModel(npc.modelId, req.houseModel);
  const dedupLines = roomLinesForNpcDedup(npc.id, req.recentChat);
  let text: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await completeNpcLine(
      model,
      [{ role: 'system', content: system }],
      req.houseModel,
    );
    const cleaned = raw ? sanitizeNpcLine(raw) : null;
    if (!cleaned) break;
    if (!isDuplicateNpcChatterText(npc.id, cleaned, dedupLines)) {
      text = cleaned;
      break;
    }
    iwarn('[npc-chatter] duplicate single reply skipped, retrying', {
      npc: req.npc,
      text: cleaned.slice(0, 80),
      attempt,
    });
  }
  if (!text) {
    ierror('[npc-chatter] single reply generation failed', { npc: req.npc, model });
    return null;
  }
  return { npc: npc.id, text };
}
