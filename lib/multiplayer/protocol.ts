/**
 * Wire protocol shared by the PartyKit room server and the browser client.
 * Pure types + tiny helpers — no React, no DOM — so it imports cleanly from
 * both `party/server.ts` (esbuild) and the Next.js client bundle.
 *
 * State is ephemeral: it lives only in the room's memory while players are
 * connected. No database, no accounts.
 */

import type { FestiePublic } from '../festie/types';
import type { StageChatterMessage } from '../stageChatter/types';
import type { LineupStatePayload } from '../lineup/types';
import type { MatchupStatePayload } from '../matchup/types';
import type { StoredLineupSuggestion } from '../lineup/types';
import type { StageChannel, StageSync, StageVideo } from '../stageVideos';
import type { EaselSessionSync, EaselSlotSync } from '../easel/types';
import type { CreatorStageSyncPayload } from '../stages/stageSync';
import type { NpcLeaderCapability } from '../npcLeaderCapability';

export type Facing = 'left' | 'right';

/** One player position in a batched move tick. */
export type PlayerMoveSync = {
  id: string;
  worldX: number;
  facing: Facing;
  walking: boolean;
};

/** The single shared room everyone joins for now. */
export const ROOM_ID = 'whichstage-global';

/** Equipped item ids replicated to other players (no local-only fields). */
export type PlayerLoadoutSync = {
  hat?: string | null;
  sunglasses?: string | null;
  mask?: string | null;
  necklace?: string | null;
  top?: string | null;
  bottom?: string | null;
  hand?: string | null;
  owned?: string[];
};

/** Identity a player chooses for the session (random color, optional name). */
export type PlayerProfile = {
  name: string | null;
  balloonColor: string;
  loadout?: PlayerLoadoutSync;
};

/** Full per-player state the room keeps in memory and replicates. */
export type PlayerState = PlayerProfile & {
  id: string;
  /** Signed-in account id when the player joined authenticated. */
  userId?: string;
  worldX: number;
  facing: Facing;
  walking: boolean;
};

/* ── Client → Server ─────────────────────────────────────────────────────── */
export type ClientMessage =
  | {
      t: 'join';
      profile: PlayerProfile;
      worldX: number;
      facing: Facing;
      walking: boolean;
      /** From `?mute=true` — disables room NPC chatter while this player is present. */
      chatterMuted?: boolean;
      /** From `?debug=true` — demo seed only, internal QA. */
      chatterDebug?: boolean;
      /** Signed-in account id — marks festie owner_on_stage for live NPC chatter. */
      userId?: string;
      /** Device capability — server picks the strongest NPC sim leader. */
      capability?: NpcLeaderCapability;
    }
  | { t: 'move'; worldX: number; facing: Facing; walking: boolean }
  | { t: 'profile'; profile: PlayerProfile }
  /** Late auth — user id was not ready when the socket joined. */
  | { t: 'auth-sync'; userId: string }
  // 1:1 proximity chat — addressed to a specific connection id.
  | { t: 'chat-open'; to: string }
  | { t: 'chat-close'; to: string }
  | { t: 'chat-typing'; to: string; typing: boolean }
  | { t: 'chat-msg'; to: string; text: string }
  // Public shout — visible to everyone in the room.
  | { t: 'ambient-msg'; text: string }
  // Public room chat (also used for 1:1 lines — no private delivery).
  | { t: 'room-chat'; text: string }
  // Stage chatter typing signal — visible to everyone in the room.
  | { t: 'room-typing'; typing: boolean }
  // NPC 1:1 chat — broadcast so everyone sees the connect glow.
  | { t: 'npc-chat'; npcId: string; open: boolean }
  /** Throttled NPC snapshot for proximity chatter + follower sync. */
  | {
      t: 'npc-positions';
      positions: { id: string; worldX: number; pct: number }[];
      viewportWidth: number;
    }
  /** Painting NPC reached the easel — starts the watched drawing clock. */
  | { t: 'easel-painter-ready'; npcId: string }
  /** Owner lineup / now-playing change — relayed to everyone in the creator room. */
  | { t: 'creator-stage-sync'; stage: CreatorStageSyncPayload }
  /** Ask the room to refresh festie roster (e.g. after describe-notes save). */
  | { t: 'festie-refresh' }
  /** Subscribe to shared lineup votes for a curated stage channel. */
  | { t: 'lineup-subscribe'; channel: StageChannel; playerId?: string }
  /** Cast one vote toward a lineup video (deck or waiting pool). */
  | { t: 'lineup-vote'; channel: StageChannel; videoId: string; playerId?: string }
  /** Suggest a custom video for the waiting pool. */
  | { t: 'lineup-suggest'; channel: StageChannel; video: StageVideo; playerId?: string }
  /** Subscribe to king-of-the-hill matchup state for a stage channel. */
  | { t: 'matchup-subscribe'; channel: StageChannel; playerId?: string; userId?: string }
  /** Cast keep (a) or swap (b) vote — re-tap refreshes weight. */
  | { t: 'matchup-vote'; channel: StageChannel; side: 'a' | 'b'; playerId?: string; userId?: string };

/** Debug metadata for NPC↔NPC pair convos. */
export type NpcConvoMeta = {
  seedKind: string;
  seed: string | null;
  models: Record<string, string>;
};

/* ── Server → Client ─────────────────────────────────────────────────────── */
export type ServerMessage =
  // `serverNow` + `stage` bootstrap synchronized video playback: the client
  // aligns its clock to `serverNow` and schedules every venue against the
  // pinned `stage` playlists so all users see the same video at the same time.
  | {
      t: 'welcome';
      selfId: string;
      players: PlayerState[];
      serverNow: number;
      stage: StageSync;
      festies?: FestiePublic[];
      /** Connection id with the strongest device — runs local NPC sim for the room. */
      npcLeaderId?: string | null;
    }
  | { t: 'festies-sync'; festies: FestiePublic[] }
  | { t: 'joined'; player: PlayerState }
  | { t: 'left'; id: string }
  /** @deprecated Single-player relay — server sends `moves-batch` instead. */
  | { t: 'moved'; id: string; worldX: number; facing: Facing; walking: boolean }
  /** All player moves collected in one ~100ms tick — one fan-out per room. */
  | { t: 'moves-batch'; moves: PlayerMoveSync[] }
  | { t: 'profile'; id: string; profile: PlayerProfile }
  // Mirror of the addressed chat messages, tagged with the sender id.
  | { t: 'chat-open'; from: string }
  | { t: 'chat-close'; from: string }
  | { t: 'chat-typing'; from: string; typing: boolean }
  | { t: 'chat-msg'; from: string; text: string }
  | { t: 'ambient'; from: string; text: string }
  /** Public room line — sender is `user:{name}` or `npc:{id}`. */
  | { t: 'room-chat'; sender: string; text: string; ts?: number }
  /** Stage chatter typing signal — sender is `user:{name}` or `npc:{id}`. */
  | { t: 'room-typing'; sender: string; typing: boolean }
  /** Scrollable stage chatter history (up to 2 days) — sent on connect. */
  | { t: 'stage-chatter-history'; messages: StageChatterMessage[] }
  // Visible to the whole room — who is in a 1:1 conversation.
  | { t: 'chat-pair'; a: string; b: string; open: boolean }
  | { t: 'npc-chat'; from: string; npcId: string; open: boolean }
  | {
      t: 'npc-convo-start';
      convoId: string;
      participants: [string, string];
      meta?: NpcConvoMeta;
    }
  | { t: 'npc-line'; convoId: string; npc: string; text: string; ts?: number }
  | { t: 'npc-convo-end'; convoId: string }
  | {
      t: 'npc-positions-sync';
      leaderId: string;
      serverNow: number;
      positions: { id: string; worldX: number; pct: number }[];
    }
  | { t: 'npc-leader'; leaderId: string | null }
  | { t: 'easel-session'; sessionStart: number; slots: EaselSlotSync[] }
  | { t: 'easel-update'; sessionStart: number; slots: EaselSlotSync[] }
  /** Creator stage lineup / scene update from owner or shuffle. */
  | { t: 'creator-stage-sync'; stage: CreatorStageSyncPayload }
  /** Shared curated-stage lineup vote counts + suggestions. */
  | { t: 'lineup-state'; channel: StageChannel; myVote?: string | null; counts: Record<string, number>; suggestions: StoredLineupSuggestion[] }
  /** King-of-the-hill holder/challenger matchup + decay-weighted slider. */
  | ({ t: 'matchup-state' } & MatchupStatePayload);

export type { EaselSessionSync, EaselSlotSync, LineupStatePayload, MatchupStatePayload, StoredLineupSuggestion };

/** Stable key for a player↔player chat pair. */
export function chatPairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function encode(msg: ClientMessage | ServerMessage): string {
  return JSON.stringify(msg);
}

export function decodeClient(raw: string): ClientMessage | null {
  try { return JSON.parse(raw) as ClientMessage; } catch { return null; }
}

export function decodeServer(raw: string): ServerMessage | null {
  try { return JSON.parse(raw) as ServerMessage; } catch { return null; }
}
