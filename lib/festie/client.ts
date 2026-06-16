'use client';

import {
  countFestieChatsInEvents,
  FESTIE_EVENT_TYPES,
  type FestieEventRow,
} from '@/lib/festie/events';
import { filterOwnerCentricRecapEvents, shouldShowSessionRecap, type FestieSessionRecap } from '@/lib/festie/sessionRecap';
import { markLocalFestieAccount } from '@/lib/festie/localAccount';
import { trackFestieSignedIn, trackFestieSignedUp } from '@/lib/analytics';
import type { FestieCache, FestieOwner } from '@/lib/festie/types';

let festieCache: FestieCache | null = null;

/** In-memory festie cache (perf only — source of truth is the API). */
export function getFestieCache(): FestieCache | null {
  return festieCache;
}

export function setFestieCache(cache: FestieCache): void {
  festieCache = cache;
}

export function clearFestieCache(): void {
  festieCache = null;
}

const fetchOpts: RequestInit = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
};

export type AuthState = {
  authenticated: boolean;
  festie: FestieOwner | null;
};

export async function fetchAuthMe(): Promise<AuthState> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return { authenticated: false, festie: null };
  const data = await res.json();
  const festie = (data.festie as FestieOwner | null) ?? null;
  if (festie) {
    setFestieCache({ id: festie.id, name: festie.name, preset: festie.preset });
  }
  return {
    authenticated: Boolean(data.authenticated),
    festie,
  };
}

export async function loginFestie(name: string, password: string): Promise<LoginFestieResult> {
  const res = await fetch('/api/auth/login', {
    ...fetchOpts,
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  const festie = data.festie as FestieOwner | null;
  if (!festie) throw new Error('Invalid name or password');
  setFestieCache({ id: festie.id, name: festie.name, preset: festie.preset });
  markLocalFestieAccount(festie.name);
  trackFestieSignedIn(festie);
  const sessionRecap = (data.sessionRecap as FestieSessionRecap | null) ?? null;
  return { festie, sessionRecap };
}

/** Mark owner return after viewing session recap (resets last_seen_at). */
export async function acknowledgeFestieReturn(): Promise<void> {
  await fetch('/api/festie/seen', { ...fetchOpts, method: 'POST' });
}

/** Mark the one-time post-signup help popup as dismissed. */
export async function dismissFestieHelp(): Promise<FestieOwner | null> {
  const res = await fetch('/api/festie/help', { ...fetchOpts, method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  const festie = (data.festie as FestieOwner | null) ?? null;
  if (festie) {
    setFestieCache({ id: festie.id, name: festie.name, preset: festie.preset });
  }
  return festie;
}

export async function fetchSessionRecapSince(
  since: string,
  festieName?: string,
): Promise<FestieSessionRecap | null> {
  try {
    const data = await fetchFestieEvents(since);
    const who = festieName?.trim() ?? '';
    const events = who
      ? filterOwnerCentricRecapEvents(data.events, who)
      : data.events;
    const recap: FestieSessionRecap = {
      since: data.since,
      until: new Date().toISOString(),
      events,
      coinsEarned: data.coinsEarned,
      chatCount: countFestieChatsInEvents(events),
      festieName: who || undefined,
    };
    return shouldShowSessionRecap(recap, who || undefined) ? recap : null;
  } catch (err) {
    console.warn('[festie] session recap fetch failed', err);
    return null;
  }
}

/** Recent activity for Life modal history — no minimum event threshold. */
export async function fetchFestieHistorySince(
  since: string,
  festieName: string,
): Promise<FestieSessionRecap> {
  const data = await fetchFestieEvents(since);
  const events = filterOwnerCentricRecapEvents(data.events, festieName);
  return {
    since: data.since,
    until: new Date().toISOString(),
    events,
    coinsEarned: data.coinsEarned,
    chatCount: countFestieChatsInEvents(events),
    festieName,
  };
}

/** Same window as the session recap popup — before last_seen_at is refreshed. */
export function historySinceForFestie(
  festie: { id: string; last_seen_at: string },
  ackedSince?: string | null,
): string {
  return ackedSince ?? festie.last_seen_at;
}

export async function logoutFestie(): Promise<void> {
  await fetch('/api/auth/logout', { ...fetchOpts, method: 'POST' });
  clearFestieCache();
}

export type CreateFestieBody = {
  name: string;
  password: string;
  preset: string;
  attributes: { energy: number; friendliness: number; chattiness: number };
  topics: string[];
  personality_notes?: string | null;
  stage_slug: string;
};

export type UpdateFestieBody = {
  preset?: string;
  attributes?: { energy: number; friendliness: number; chattiness: number };
  topics?: string[];
  personality_notes?: string | null;
  stage_slug?: string;
  notify_email?: string | null;
  email_opted_in?: boolean;
  llm_provider?: string;
};

export type FestieEventsResponse = {
  since: string;
  events: FestieEventRow[];
  coinsEarned: number;
  chatCount: number;
};

export type LoginFestieResult = {
  festie: FestieOwner;
  sessionRecap: FestieSessionRecap | null;
};

export async function fetchFestieEvents(since?: string): Promise<FestieEventsResponse> {
  const qs = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/festie/events${qs}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as FestieEventsResponse;
}

export async function fetchFestie(): Promise<FestieOwner | null> {
  const res = await fetch('/api/festie', { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  const festie = (data.festie as FestieOwner | null) ?? null;
  if (festie) {
    setFestieCache({ id: festie.id, name: festie.name, preset: festie.preset });
    markLocalFestieAccount(festie.name);
  }
  return festie;
}

export async function updateFestie(body: UpdateFestieBody): Promise<FestieOwner> {
  const res = await fetch('/api/festie', {
    ...fetchOpts,
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  const festie = data.festie as FestieOwner;
  setFestieCache({ id: festie.id, name: festie.name, preset: festie.preset });
  markLocalFestieAccount(festie.name);
  return festie;
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch('/api/auth/password', {
    ...fetchOpts,
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
}

export async function requestPasswordReset(name: string, email: string): Promise<string> {
  const res = await fetch('/api/auth/forgot-password', {
    ...fetchOpts,
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return String(data.message ?? 'If an account with that festie name and email exists, we sent a password reset link.');
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/reset-password', {
    ...fetchOpts,
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
}

export async function createFestie(body: CreateFestieBody): Promise<FestieOwner> {
  const res = await fetch('/api/festie', {
    ...fetchOpts,
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  const festie = data.festie as FestieOwner;
  setFestieCache({ id: festie.id, name: festie.name, preset: festie.preset });
  markLocalFestieAccount(festie.name);
  trackFestieSignedUp(festie);
  return festie;
}
