/**
 * Wire protocol shared by the PartyKit room server and the browser client.
 * Pure types + tiny helpers — no React, no DOM — so it imports cleanly from
 * both `party/server.ts` (esbuild) and the Next.js client bundle.
 *
 * State is ephemeral: it lives only in the room's memory while players are
 * connected. No database, no accounts.
 */

export type Facing = 'left' | 'right';

/** The single shared room everyone joins for now. */
export const ROOM_ID = 'chillscreen-global';

/** Identity a player chooses for the session (random color, optional name). */
export type PlayerProfile = {
  name: string | null;
  balloonColor: string;
};

/** Full per-player state the room keeps in memory and replicates. */
export type PlayerState = PlayerProfile & {
  id: string;
  worldX: number;
  facing: Facing;
  walking: boolean;
};

/* ── Client → Server ─────────────────────────────────────────────────────── */
export type ClientMessage =
  | { t: 'join'; profile: PlayerProfile; worldX: number; facing: Facing; walking: boolean }
  | { t: 'move'; worldX: number; facing: Facing; walking: boolean }
  | { t: 'profile'; profile: PlayerProfile }
  // 1:1 proximity chat — addressed to a specific connection id.
  | { t: 'chat-open'; to: string }
  | { t: 'chat-close'; to: string }
  | { t: 'chat-typing'; to: string; typing: boolean }
  | { t: 'chat-msg'; to: string; text: string };

/* ── Server → Client ─────────────────────────────────────────────────────── */
export type ServerMessage =
  | { t: 'welcome'; selfId: string; players: PlayerState[] }
  | { t: 'joined'; player: PlayerState }
  | { t: 'left'; id: string }
  | { t: 'moved'; id: string; worldX: number; facing: Facing; walking: boolean }
  | { t: 'profile'; id: string; profile: PlayerProfile }
  // Mirror of the addressed chat messages, tagged with the sender id.
  | { t: 'chat-open'; from: string }
  | { t: 'chat-close'; from: string }
  | { t: 'chat-typing'; from: string; typing: boolean }
  | { t: 'chat-msg'; from: string; text: string };

export function encode(msg: ClientMessage | ServerMessage): string {
  return JSON.stringify(msg);
}

export function decodeClient(raw: string): ClientMessage | null {
  try { return JSON.parse(raw) as ClientMessage; } catch { return null; }
}

export function decodeServer(raw: string): ServerMessage | null {
  try { return JSON.parse(raw) as ServerMessage; } catch { return null; }
}
