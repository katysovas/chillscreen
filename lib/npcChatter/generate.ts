import { ierror, ilog, iwarn } from '@/lib/internalDebug';
import { sanitizeNpcLine } from '@/lib/messageFilter';
import { resolveNpcRosterEntry } from '@/lib/npcRoster.server';
import type { RoomChatLine } from './prompts';
import { buildLineSystemPrompt, buildSingleReplySystemPrompt } from './prompts';
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
    const seed = isA && isOpener ? req.seed : null;

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
    const raw = await completeNpcLine(model, messages, req.houseModel);
    const text = raw ? sanitizeNpcLine(raw) : null;
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
  });

  const model = resolveModel(npc.modelId, req.houseModel);
  const text = await completeNpcLine(
    model,
    [{ role: 'system', content: system }],
    req.houseModel,
  );
  const cleaned = text ? sanitizeNpcLine(text) : null;
  if (!cleaned) {
    ierror('[npc-chatter] single reply generation failed', { npc: req.npc, model });
    return null;
  }
  return { npc: npc.id, text: cleaned };
}
