import posthog from 'posthog-js';
import { getOrCreatePlayerId } from '@/lib/playerStorage';

/** Link an anonymous id to the chosen display name. */
export function identifyPlayer(name: string) {
  if (typeof window === 'undefined') return;
  posthog.identify(getOrCreatePlayerId(), { name });
}

/** First-time character creation — welcome flow submit. */
export function trackCharacterCreated(name: string) {
  if (typeof window === 'undefined') return;
  const id = getOrCreatePlayerId();
  posthog.identify(id, { name });
  posthog.capture('character_created', { name });
}

/** Festie account created (signup). */
export function trackFestieSignedUp(festie: {
  id: string;
  name: string;
  stage_slug: string;
  preset: string;
}) {
  if (typeof window === 'undefined') return;
  const playerId = getOrCreatePlayerId();
  posthog.identify(festie.id, {
    festie_name: festie.name,
    player_id: playerId,
  });
  posthog.capture('festie_signed_up', {
    festie_id: festie.id,
    festie_name: festie.name,
    stage_slug: festie.stage_slug,
    preset: festie.preset,
  });
}

/** Festie account sign-in. */
export function trackFestieSignedIn(festie: {
  id: string;
  name: string;
  stage_slug: string;
}) {
  if (typeof window === 'undefined') return;
  const playerId = getOrCreatePlayerId();
  posthog.identify(festie.id, {
    festie_name: festie.name,
    player_id: playerId,
  });
  posthog.capture('festie_signed_in', {
    festie_id: festie.id,
    festie_name: festie.name,
    stage_slug: festie.stage_slug,
  });
}

export type NpcChatterKind = 'pair' | 'solo' | 'player_chat';

/** Ambient or 1:1 NPC speech line. */
export function trackNpcChatterLine(props: {
  npcId: string;
  npcName: string;
  text: string;
  kind: NpcChatterKind;
  convoId?: string;
  stage?: string;
  playerName?: string;
  isFestie?: boolean;
}) {
  if (typeof window === 'undefined') return;
  posthog.capture('npc_chatter_line', {
    npc_id: props.npcId,
    npc_name: props.npcName,
    text: props.text,
    kind: props.kind,
    convo_id: props.convoId ?? null,
    stage: props.stage ?? null,
    player_name: props.playerName ?? null,
    is_festie: props.isFestie ?? false,
  });
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
}
