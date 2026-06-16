import { getPosthog } from '@/lib/posthogClient';
import { getOrCreatePlayerId } from '@/lib/playerStorage';

function withPosthog(run: (ph: NonNullable<Awaited<ReturnType<typeof getPosthog>>>) => void): void {
  if (typeof window === 'undefined') return;
  void getPosthog().then(ph => {
    if (ph) run(ph);
  });
}

/** Link an anonymous id to the chosen display name. */
export function identifyPlayer(name: string) {
  withPosthog(ph => {
    ph.identify(getOrCreatePlayerId(), { name });
  });
}

/** SPA / App Router pageview — includes landing at `/`. */
export function trackPageView(pathname: string, search = '') {
  withPosthog(ph => {
    const url = `${window.location.origin}${pathname}${search}`;
    if (pathname === '/') {
      ph.identify(getOrCreatePlayerId());
    }
    ph.capture('$pageview', {
      $current_url: url,
      page_type: pathname === '/' ? 'landing' : 'app',
      path: pathname,
    });
  });
}

/** First-time character creation — welcome flow submit. */
export function trackCharacterCreated(name: string) {
  withPosthog(ph => {
    const id = getOrCreatePlayerId();
    ph.identify(id, { name });
    ph.capture('character_created', { name });
  });
}

/** Festie account created (signup). */
export function trackFestieSignedUp(festie: {
  id: string;
  name: string;
  stage_slug: string;
  preset: string;
}) {
  withPosthog(ph => {
    const playerId = getOrCreatePlayerId();
    ph.identify(festie.id, {
      festie_name: festie.name,
      player_id: playerId,
    });
    ph.capture('festie_signed_up', {
      festie_id: festie.id,
      festie_name: festie.name,
      stage_slug: festie.stage_slug,
      preset: festie.preset,
    });
  });
}

/** Festie account sign-in. */
export function trackFestieSignedIn(festie: {
  id: string;
  name: string;
  stage_slug: string;
}) {
  withPosthog(ph => {
    const playerId = getOrCreatePlayerId();
    ph.identify(festie.id, {
      festie_name: festie.name,
      player_id: playerId,
    });
    ph.capture('festie_signed_in', {
      festie_id: festie.id,
      festie_name: festie.name,
      stage_slug: festie.stage_slug,
    });
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
  withPosthog(ph => {
    ph.capture('npc_chatter_line', {
      npc_id: props.npcId,
      npc_name: props.npcName,
      text: props.text,
      kind: props.kind,
      convo_id: props.convoId ?? null,
      stage: props.stage ?? null,
      player_name: props.playerName ?? null,
      is_festie: props.isFestie ?? false,
    });
  });
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  withPosthog(ph => {
    ph.capture(event, properties);
  });
}
