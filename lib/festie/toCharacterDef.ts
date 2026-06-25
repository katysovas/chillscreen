import type { CharacterDef } from '@/components/game/characters';
import type { CharacterLoadout } from '@/components/game/characters/loadout';
import { finalizeNpcCharacterDef } from '@/components/game/characters/loadout';
import { loadoutFromSync } from '@/lib/multiplayer/loadoutSync';
import type { Personality } from '@/components/game/NPC';
import { festiePersonalityNotesForNpcChatter } from '@/lib/festie/describeNotes';
import { festieModelIdForProvider } from '@/lib/festie/llmProviders';
import { festiePresetById } from '@/lib/festie/presets';
import type { FestieAttributes, FestiePublic } from '@/lib/festie/types';
import { stageAnchorForRoute } from '@/lib/isolatedCity';
import type { VenueRoute } from '@/lib/venueSlugs';

export const FESTIE_NPC_ID_PREFIX = 'festie-';

export function festieNpcId(festieId: string): string {
  return `${FESTIE_NPC_ID_PREFIX}${festieId}`;
}

export function isFestieNpcId(id: string): boolean {
  return id.startsWith(FESTIE_NPC_ID_PREFIX);
}

export function festieIdFromNpcId(npcId: string): string | null {
  if (!isFestieNpcId(npcId)) return null;
  return npcId.slice(FESTIE_NPC_ID_PREFIX.length) || null;
}

function attributesToPersonality(attrs: FestieAttributes): Personality {
  const energy = attrs.energy / 10;
  const chatty = attrs.chattiness / 10;
  return {
    speed: 0.04 + energy * 0.1,
    idleMs: [
      Math.round(3200 - chatty * 2200),
      Math.round(7200 - chatty * 4200),
    ],
    wanderRange: [-20, 118],
    jumpiness: 0.05 + energy * 0.5,
  };
}

/** Map a synced offline festie into the same shape as ambient NPCs. */
export function festieToCharacterDef(
  festie: FestiePublic,
  route: VenueRoute,
  index: number,
): CharacterDef {
  const preset = festiePresetById(festie.preset);
  const anchor = stageAnchorForRoute(route);
  const fromLeft = index % 2 === 0;
  const balloonColor = festie.balloon_color ?? preset.balloonColor;
  const loadout = festie.loadout
    ? loadoutFromSync(festie.loadout, balloonColor)
    : undefined;

  return finalizeNpcCharacterDef({
    id: festieNpcId(festie.id),
    name: festie.name,
    balloonColor,
    outfit: loadout ? undefined : preset.outfit,
    loadout,
    startX: fromLeft ? -16 - (index % 3) * 5 : 108 + (index % 3) * 5,
    entryDirection: fromLeft ? 'right' : 'left',
    entryDelay: 2_000 + index * 1_500,
    stageCrowd: anchor ?? undefined,
    personality: attributesToPersonality(festie.attributes),
    personalityNotes: festiePersonalityNotesForNpcChatter(festie),
    modelId: festieModelIdForProvider(festie.llm_provider),
  });
}

/** Hide festie NPC when owner is live as a remote player (keep visible for local autopilot). */
export function hideFestieNpcForConnectedOwner(
  festie: FestiePublic,
  connectedUserIds: ReadonlySet<string>,
  localUserId: string | null,
  localAutopilot: boolean,
): boolean {
  const uid = festie.owner_user_id;
  if (!uid || !connectedUserIds.has(uid)) return false;
  return !(localUserId === uid && localAutopilot);
}

export function festiesToCharacterDefs(
  festies: FestiePublic[],
  route: VenueRoute,
): CharacterDef[] {
  return festies.map((festie, index) => festieToCharacterDef(festie, route, index));
}

/** Mirror the signed-in player's equipped look on their festie avatar. */
export function applyOwnerPlayerLookToFestieDef(
  cfg: CharacterDef,
  ownerFestieNpcId: string,
  balloonColor: string,
  loadout: CharacterLoadout,
  extras?: Partial<CharacterDef>,
): CharacterDef {
  if (cfg.id !== ownerFestieNpcId) return cfg;
  return {
    ...cfg,
    balloonColor,
    loadout,
    outfit: undefined,
    accessory: undefined,
    ...extras,
  };
}
