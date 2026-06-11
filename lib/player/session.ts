'use client';

import { normalizeLoadout } from '@/components/game/characters/loadout/defaults';
import type { CharacterLoadout } from '@/components/game/characters/loadout/types';
import { loadoutItem } from '@/components/game/characters/loadout/catalog';
import { loadoutItemId } from '@/components/game/characters/loadout/types';
import type { FestieOwner } from '@/lib/festie/types';
import { STARTING_COINS } from '@/lib/player/constants';

export { STARTING_COINS };

export type VendorPurchaseResult =
  | { ok: true; loadout: CharacterLoadout; coins: number; charged: boolean }
  | { ok: false; reason: 'unknown_item' | 'insufficient_coins' | 'not_signed_in' };

type SessionState = {
  hydrated: boolean;
  authenticated: boolean;
  userId: string | null;
  /** Festie name when signed in; guest display name is session-only. */
  name: string | null;
  coins: number;
  loadout: CharacterLoadout | null;
  festie: FestieOwner | null;
};

let guestId: string | null = null;

function getGuestId(): string {
  if (!guestId) guestId = crypto.randomUUID();
  return guestId;
}

let state: SessionState = {
  hydrated: false,
  authenticated: false,
  userId: null,
  name: null,
  coins: STARTING_COINS,
  loadout: null,
  festie: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(fn => fn());
}

export function subscribePlayerSession(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getPlayerSession(): Readonly<SessionState> {
  return state;
}

const fetchOpts: RequestInit = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
};

/** Load profile from API when signed in; guests keep in-memory defaults. */
export async function hydratePlayerSession(): Promise<SessionState> {
  try {
    const res = await fetch('/api/player', { credentials: 'include' });
    if (res.status === 401) {
      state = {
        ...state,
        hydrated: true,
        authenticated: false,
        userId: null,
        festie: null,
        coins: state.coins,
        loadout: state.loadout,
      };
      emit();
      return state;
    }
    if (!res.ok) {
      state = { ...state, hydrated: true };
      emit();
      return state;
    }
    const data = await res.json();
    state = {
      hydrated: true,
      authenticated: true,
      userId: String(data.userId),
      name: data.name != null ? String(data.name) : null,
      coins: Number(data.coins),
      loadout: (data.loadout as CharacterLoadout) ?? null,
      festie: (data.festie as FestieOwner | null) ?? null,
    };
    emit();
    return state;
  } catch {
    state = { ...state, hydrated: true };
    emit();
    return state;
  }
}

export function getOrCreatePlayerId(): string {
  return state.userId ?? getGuestId();
}

export function getPlayerName(): string | null {
  return state.name;
}

/** Session-only display name for guests (signed-in name comes from DB). */
export function setPlayerName(name: string): void {
  if (state.authenticated) return;
  state = { ...state, name: name.trim() };
  emit();
}

export function getPlayerCoins(): number {
  return state.coins;
}

export function getPlayerLoadout(balloonColor: string): CharacterLoadout {
  return normalizeLoadout(state.loadout ?? undefined, balloonColor);
}

async function persistLoadout(loadout: CharacterLoadout, balloonColor: string): Promise<void> {
  if (!state.authenticated) {
    state = { ...state, loadout };
    emit();
    return;
  }
  const res = await fetch('/api/player', {
    ...fetchOpts,
    method: 'PATCH',
    body: JSON.stringify({ loadout, balloonColor }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  state = { ...state, loadout: data.loadout as CharacterLoadout };
  emit();
}

export async function addPlayerCoins(amount: number): Promise<number> {
  const delta = Math.max(0, Math.floor(amount));
  if (!state.authenticated) {
    state = { ...state, coins: state.coins + delta };
    emit();
    return state.coins;
  }
  const res = await fetch('/api/player/coins', {
    ...fetchOpts,
    method: 'POST',
    body: JSON.stringify({ amount: delta }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  state = { ...state, coins: Number(data.coins) };
  emit();
  return state.coins;
}

export async function purchaseVendorItem(
  itemId: string,
  balloonColor: string,
): Promise<VendorPurchaseResult> {
  if (!state.authenticated) {
    return { ok: false, reason: 'not_signed_in' };
  }
  const res = await fetch('/api/vendor/purchase', {
    ...fetchOpts,
    method: 'POST',
    body: JSON.stringify({ itemId, balloonColor }),
  });
  const data = await res.json();
  if (res.status === 402) return { ok: false, reason: 'insufficient_coins' };
  if (!res.ok) {
    if (data.error === 'unknown_item') return { ok: false, reason: 'unknown_item' };
    return { ok: false, reason: 'not_signed_in' };
  }
  state = {
    ...state,
    loadout: data.loadout as CharacterLoadout,
    coins: Number(data.coins),
  };
  emit();
  return {
    ok: true,
    loadout: getPlayerLoadout(balloonColor),
    coins: state.coins,
    charged: Boolean(data.charged),
  };
}

export async function unequipLoadoutItem(
  itemId: string,
  balloonColor: string,
): Promise<CharacterLoadout | null> {
  const def = loadoutItem(itemId);
  if (!def) return null;
  const current = getPlayerLoadout(balloonColor);
  if (loadoutItemId(current, def.slot) !== itemId) return null;

  const next = normalizeLoadout(
    {
      ...current,
      [def.slot]: def.slot === 'hand' ? 'hand-balloon' : null,
    },
    balloonColor,
  );
  await persistLoadout(next, balloonColor);
  return getPlayerLoadout(balloonColor);
}
