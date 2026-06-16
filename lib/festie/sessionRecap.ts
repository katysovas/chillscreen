import {
  FESTIE_EVENT_TYPES,
  hasEnoughRecapEvents,
  type FestieChatEventPayload,
  type FestieCoinPickupPayload,
  type FestieEventRow,
  type FestieLifeLogPayload,
  type FestieNpcChatterPayload,
  type LifeLogKind,
  isRecapDisplayEvent,
  SESSION_RECAP_MIN_EVENT_COUNT,
} from '@/lib/festie/events';
export type FestieSessionRecap = {
  since: string;
  until?: string;
  events: FestieEventRow[];
  coinsEarned: number;
  chatCount: number;
  festieName?: string;
};

export type RecapLine = {
  id: number;
  kind: 'chat' | 'npc' | 'coin' | 'log';
  emoji: string;
  time: string;
  title: string;
  detail?: string;
  npcConversation?: RecapNpcConversation;
};

export type RecapNpcConversation = {
  partner: string;
  festieLine: string;
  partnerLine: string;
  turns: RecapChatTurn[];
};

export type RecapChatTurn = {
  speaker: string;
  text: string;
  side: 'left' | 'right';
};

/** One-line overheard preview — partner + festie lines joined. */
export function npcConversationPreview(convo: RecapNpcConversation, max = 96): string {
  const chunk = convo.turns.map(t => t.text).filter(Boolean).join(' · ')
    || [convo.partnerLine, convo.festieLine].filter(Boolean).join(' · ');
  if (!chunk) return '…';
  if (chunk.length <= max) return chunk;
  return `${chunk.slice(0, max - 1).trim()}…`;
}

function parseNpcTranscript(
  payload: FestieNpcChatterPayload,
  festieName: string,
  partner: string,
): RecapChatTurn[] | null {
  if (!Array.isArray(payload.transcript) || payload.transcript.length === 0) return null;
  const turns: RecapChatTurn[] = [];
  for (const row of payload.transcript) {
    const text = typeof row.text === 'string' ? row.text.trim() : '';
    if (!text) continue;
    const isFestie = row.role === 'festie';
    turns.push({
      speaker: isFestie ? festieName : partner,
      text,
      side: isFestie ? 'right' : 'left',
    });
  }
  return turns.length > 0 ? turns : null;
}

export function npcConversationTurns(
  convo: RecapNpcConversation,
  festieName: string,
): RecapChatTurn[] {
  if (convo.turns.length > 0) return convo.turns;
  const turns: RecapChatTurn[] = [];
  if (convo.partnerLine) {
    turns.push({ speaker: convo.partner, text: convo.partnerLine, side: 'left' });
  }
  if (convo.festieLine) {
    turns.push({ speaker: festieName, text: convo.festieLine, side: 'right' });
  }
  return turns;
}

export function lifeLogEmoji(kind: LifeLogKind | 'npc_chatter'): string {
  switch (kind) {
    case 'overheard':
    case 'npc_chatter':
      return '👂';
    case 'stream_watched':
      return '📺';
    case 'presence':
      return '👥';
    case 'npc_coins':
      return '🪙';
    case 'lost_item':
      return '🎒';
    case 'failed_plan':
      return '🥁';
    case 'scenery':
      return '🌁';
    case 'food_incident':
      return '🌭';
    case 'npc_interaction':
      return '💬';
    case 'greg_sighting':
      return '👀';
    case 'nap':
      return '💤';
    case 'trade':
      return '🔄';
    case 'mystery':
      return '❓';
    case 'crowd_milestone':
      return '🙌';
    case 'animal':
      return '🐦';
    case 'lost_found':
      return '🥾';
    case 'dance':
      return '💃';
    case 'queue':
      return '🚶';
    case 'weather':
      return '🌤️';
    case 'merch':
      return '👕';
    case 'sound_check':
      return '🔊';
    case 'wandering':
      return '🗺️';
    case 'collection':
      return '📦';
    default:
      return '📋';
  }
}

export function filterRecapEvents(events: FestieEventRow[]): FestieEventRow[] {
  return events.filter(isRecapDisplayEvent);
}

/** Ambient festival logs with no random-NPC subject — always shown. */
const AMBIENT_LIFE_LOG_KINDS: ReadonlySet<LifeLogKind> = new Set([
  'overheard',
  'presence',
  'mystery',
  'crowd_milestone',
  'lost_found',
  'weather',
  'sound_check',
]);

/** Life logs about the owner's festie, or venue-wide ambient moments. */
export function isOwnerCentricLifeLog(
  payload: FestieLifeLogPayload,
  festieName: string,
): boolean {
  if (AMBIENT_LIFE_LOG_KINDS.has(payload.kind)) return true;
  const who = festieName.trim().toLowerCase();
  if (!who) return false;
  return payload.text.toLowerCase().includes(who);
}

export function filterOwnerCentricRecapEvents(
  events: FestieEventRow[],
  festieName: string,
): FestieEventRow[] {
  return filterRecapEvents(events).filter(event => {
    if (event.type !== FESTIE_EVENT_TYPES.LIFE_LOG) return true;
    return isOwnerCentricLifeLog(event.payload as FestieLifeLogPayload, festieName);
  });
}

function eventToRecapLine(event: FestieEventRow, who: string): RecapLine | null {
    if (event.type === FESTIE_EVENT_TYPES.LIFE_LOG) {
      const p = event.payload as FestieLifeLogPayload;
      return {
        id: event.id,
        kind: 'log',
        emoji: lifeLogEmoji(p.kind),
        time: event.created_at,
        title: p.text,
      };
    }

    if (event.type === FESTIE_EVENT_TYPES.NPC_CHATTER) {
      const p = event.payload as FestieNpcChatterPayload;
      const partner = p.partnerNpcName?.trim() || 'someone';
      const festieLine = p.festieLine?.trim() ?? '';
      const partnerLine = p.partnerLine?.trim() ?? '';
      const turns = parseNpcTranscript(p, who, partner)
        ?? (() => {
          const fallback: RecapChatTurn[] = [];
          if (partnerLine) fallback.push({ speaker: partner, text: partnerLine, side: 'left' });
          if (festieLine) fallback.push({ speaker: who, text: festieLine, side: 'right' });
          return fallback;
        })();
      const npcConversation: RecapNpcConversation = {
        partner,
        festieLine,
        partnerLine,
        turns,
      };
      return {
        id: event.id,
        kind: 'npc',
        emoji: lifeLogEmoji('npc_chatter'),
        time: event.created_at,
        title: `Chatted with ${partner}`,
        detail: npcConversationPreview(npcConversation),
        npcConversation,
      };
    }

    const p = event.payload as FestieChatEventPayload;
    const player = p.playerName?.trim() || 'Someone';
    if (p.isGreeting) {
      return {
        id: event.id,
        kind: 'chat',
        emoji: '💬',
        time: event.created_at,
        title: `${player} waved at ${who}`,
        detail: `${who}: ${p.reply}`,
      };
    }
    const userLine = p.userMessage?.trim();
    return {
      id: event.id,
      kind: 'chat',
      emoji: '💬',
      time: event.created_at,
      title: `${player} → ${who}`,
      detail: userLine
        ? `${player}: ${userLine}\n${who}: ${p.reply}`
        : `${who}: ${p.reply}`,
    };
}

export function recapLinesFromEvents(
  events: FestieEventRow[],
  festieName: string,
): RecapLine[] {
  const who = festieName.trim() || 'Your festie';
  const filtered = filterOwnerCentricRecapEvents(events, who);

  let totalCoins = 0;
  let coinLineId = 0;
  let coinTime = '';
  const lines: RecapLine[] = [];

  for (const event of filtered) {
    if (event.type === FESTIE_EVENT_TYPES.COIN_PICKUP) {
      const p = event.payload as FestieCoinPickupPayload;
      totalCoins += p.amount;
      coinLineId = event.id;
      coinTime = event.created_at;
      continue;
    }
    const line = eventToRecapLine(event, who);
    if (line) lines.push(line);
  }

  if (totalCoins > 0) {
    lines.push({
      id: coinLineId,
      kind: 'coin',
      emoji: '🪙',
      time: coinTime,
      title: `${totalCoins} coin${totalCoins === 1 ? '' : 's'} collected`,
    });
  }

  lines.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  return lines;
}

export function shouldShowSessionRecap(
  recap: FestieSessionRecap | null | undefined,
  festieName?: string,
): boolean {
  if (!recap) return false;
  const who = festieName?.trim() || recap.festieName?.trim();
  if (who) {
    return filterOwnerCentricRecapEvents(recap.events, who).length > SESSION_RECAP_MIN_EVENT_COUNT;
  }
  return hasEnoughRecapEvents(recap.events);
}

/** Dev preview — sample last-session activity. */
export function sampleSessionRecap(festieName: string): FestieSessionRecap {
  const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const until = new Date().toISOString();
  const events: FestieEventRow[] = [
    {
      id: 9001,
      festie_id: 'sample',
      type: FESTIE_EVENT_TYPES.CHAT,
      created_at: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      payload: {
        playerName: 'Maya',
        isGreeting: true,
        userMessage: null,
        reply: 'hey! your festie is vibing near the main stage',
        llm: true,
      },
    },
    {
      id: 9002,
      festie_id: 'sample',
      type: FESTIE_EVENT_TYPES.LIFE_LOG,
      created_at: new Date(Date.now() - 3.2 * 60 * 60 * 1000).toISOString(),
      payload: {
        kind: 'overheard',
        text: 'overheard near the main stage: "the bass is doing my taxes"',
        synthesized: true,
      },
    },
    {
      id: 9003,
      festie_id: 'sample',
      type: FESTIE_EVENT_TYPES.COIN_PICKUP,
      created_at: new Date(Date.now() - 2.8 * 60 * 60 * 1000).toISOString(),
      payload: { amount: 3, balance: 12 },
    },
    {
      id: 9004,
      festie_id: 'sample',
      type: FESTIE_EVENT_TYPES.NPC_CHATTER,
      created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      payload: {
        partnerNpcId: 'gen-cinema-1-todd',
        partnerNpcName: 'todd',
        festieLine: 'need one more blanket layer and maybe hot cocoa if the wind keeps up',
        partnerLine: 'hoodie counts as a pillow honestly and the bass keeps you warm anyway',
        transcript: [
          { role: 'partner', text: 'hoodie counts as a pillow honestly' },
          { role: 'festie', text: 'need one more blanket layer and maybe hot cocoa if the wind keeps up' },
          { role: 'partner', text: 'and the bass keeps you warm anyway' },
        ],
        synthesized: true,
      },
    },
    {
      id: 9005,
      festie_id: 'sample',
      type: FESTIE_EVENT_TYPES.LIFE_LOG,
      created_at: new Date(Date.now() - 2.1 * 60 * 60 * 1000).toISOString(),
      payload: {
        kind: 'lost_item',
        text: `${festieName.toLowerCase()} lost a glowstick, not looking for it`,
        synthesized: true,
      },
    },
    {
      id: 9006,
      festie_id: 'sample',
      type: FESTIE_EVENT_TYPES.LIFE_LOG,
      created_at: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(),
      payload: {
        kind: 'dance',
        text: `${festieName.toLowerCase()} busted out the silent disco shuffle for 45 seconds. no witnesses`,
        synthesized: true,
      },
    },
    {
      id: 9007,
      festie_id: 'sample',
      type: FESTIE_EVENT_TYPES.CHAT,
      created_at: new Date(Date.now() - 1.2 * 60 * 60 * 1000).toISOString(),
      payload: {
        playerName: 'Jules',
        isGreeting: false,
        userMessage: 'where is the afterparty?',
        reply: 'heard something brewing by the neon tent',
        llm: true,
      },
    },
    {
      id: 9008,
      festie_id: 'sample',
      type: FESTIE_EVENT_TYPES.LIFE_LOG,
      created_at: new Date(Date.now() - 0.6 * 60 * 60 * 1000).toISOString(),
      payload: {
        kind: 'food_incident',
        text: `${festieName.toLowerCase()} lost a fry to a very confident pigeon. mutual respect`,
        synthesized: true,
      },
    },
  ];
  return {
    since,
    until,
    events,
    coinsEarned: 3,
    chatCount: 2,
  };
}

export function recapSummary(recap: FestieSessionRecap, festieName: string): string {
  const who = festieName.trim() || 'Your festie';
  const display = filterOwnerCentricRecapEvents(recap.events, who);
  const flavorLogs = display.filter(e => e.type === FESTIE_EVENT_TYPES.LIFE_LOG).length;
  const chats = recap.chatCount;
  const coins = recap.coinsEarned;
  const parts: string[] = [];
  if (flavorLogs > 0) parts.push(`${flavorLogs} festival moment${flavorLogs === 1 ? '' : 's'}`);
  if (chats > 0) parts.push(`${chats} chat${chats === 1 ? '' : 's'}`);
  if (coins > 0) parts.push(`${coins} coin${coins === 1 ? '' : 's'}`);
  if (parts.length === 0) return `${who} had a quiet session.`;
  return `While you were away — ${parts.join(', ')}.`;
}

export function formatRecapSessionRange(since: string, until?: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  const a = fmt(since);
  const b = until ? fmt(until) : 'now';
  if (!a) return b;
  return `${a} → ${b}`;
}
