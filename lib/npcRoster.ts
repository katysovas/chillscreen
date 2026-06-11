/**
 * Client-safe roster — no modelId or personalityNotes.
 * Full roster lives in npcRoster.server.ts (server / PartyKit only).
 */
import publicData from '@/data/npc-roster-public.json';

export type NpcRosterPublic = {
  id: string;
  displayName: string;
  modelDisplayName?: string;
};

const ROSTER: NpcRosterPublic[] = publicData.npcs;

export function getNpcRosterPublic(): NpcRosterPublic[] {
  return ROSTER;
}
