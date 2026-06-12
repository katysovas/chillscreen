import {
  FESTIE_EVENT_TYPES,
  type FestieChatEventPayload,
  type FestieCoinPickupPayload,
  type FestieEventRow,
  type FestieLifeLogPayload,
  type FestieNpcChatterPayload,
  type LifeLogKind,
  hasRecapContent,
  isRecapDisplayEvent,
} from '@/lib/festie/events';
export type FestieSessionRecap = {
  since: string;
  until?: string;
  events: FestieEventRow[];
  coinsEarned: number;
  chatCount: number;
};

export type RecapLine = {
  id: number;
  kind: 'chat' | 'npc' | 'coin' | 'log';
  emoji: string;
  time: string;
  title: string;
  detail?: string;
};

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

export function recapLinesFromEvents(
  events: FestieEventRow[],
  festieName: string,
): RecapLine[] {
  const who = festieName.trim() || 'Your festie';
  return filterRecapEvents(events).map(event => {
    if (event.type === FESTIE_EVENT_TYPES.COIN_PICKUP) {
      const p = event.payload as FestieCoinPickupPayload;
      return {
        id: event.id,
        kind: 'coin',
        emoji: '🪙',
        time: event.created_at,
        title: `+${p.amount} coin${p.amount === 1 ? '' : 's'} picked up`,
        detail: `Balance: ${p.balance}`,
      };
    }

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
      const excerpt = p.festieLine?.trim() || p.partnerLine?.trim() || '…';
      return {
        id: event.id,
        kind: 'log',
        emoji: lifeLogEmoji('npc_chatter'),
        time: event.created_at,
        title: `overheard near the crowd: "${excerpt}"`,
        detail: `${who} and ${partner} were chatting`,
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
  });
}

export function shouldShowSessionRecap(recap: FestieSessionRecap | null | undefined): boolean {
  return Boolean(recap && hasRecapContent(recap.events));
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
      type: FESTIE_EVENT_TYPES.LIFE_LOG,
      created_at: new Date(Date.now() - 2.1 * 60 * 60 * 1000).toISOString(),
      payload: {
        kind: 'greg_sighting',
        text: 'someone claims they saw greg near the tents. unconfirmed',
        synthesized: true,
      },
    },
    {
      id: 9005,
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
  const display = filterRecapEvents(recap.events);
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
