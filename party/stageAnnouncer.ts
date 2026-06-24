import type * as Party from 'partykit/server';
import { chatterAuthHeader } from '../lib/npcChatter/auth';
import { isMatchupChannel } from '../lib/matchup/config';
import type { RoomState } from '../lib/matchup/types';
import { nextRotationBoundaryMs } from '../lib/stageAnnounce/boundary';
import {
  channelAnnounces,
  stageChannelForRoom,
  venueSlugForRoom,
} from '../lib/stageAnnounce/config';
import { announceContextFor } from '../lib/stageAnnounce/key';
import type { StageChannel, StageSync } from '../lib/stageVideos';
import type { MatchupStore } from './matchupStore';

const STORAGE_LAST_KEY = 'announce:last-key';
const STORAGE_DISABLED = 'announce:disabled';

export class StageAnnouncer {
  private loggedMissingWebhook = new Set<string>();
  private loggedMissingSecret = false;

  constructor(
    private readonly storage: Party.Room['storage'],
    private readonly roomId: string,
  ) {}

  private async postAnnounce(
    apiBase: string,
    secret: string | undefined,
    body: Record<string, unknown>,
  ): Promise<'ok' | 'missing' | 'dead' | 'rate-limited' | 'error'> {
    if (!secret?.trim()) {
      if (!this.loggedMissingSecret) {
        this.loggedMissingSecret = true;
        console.warn(
          '[announce] NPC_CHATTER_SECRET missing on PartyKit — redeploy with npm run party:deploy',
        );
      }
      return 'error';
    }
    try {
      const res = await fetch(`${apiBase}/api/announce`, {
        method: 'POST',
        headers: {
          ...chatterAuthHeader(secret),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (res.status === 204) return 'missing';
      if (res.status === 410) return 'dead';
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        console.warn('[announce] rate limited', this.roomId, retryAfter ?? '');
        return 'rate-limited';
      }
      if (!res.ok) {
        console.error('[announce] api', res.status, await res.text());
        return 'error';
      }
      return 'ok';
    } catch (err) {
      console.error('[announce] fetch failed', err);
      return 'error';
    }
  }

  private async announceStep(
    channel: StageChannel,
    sync: StageSync,
    now: number,
    apiBase: string,
    secret: string | undefined,
    kothState?: RoomState | null,
  ): Promise<void> {
    if (await this.storage.get<boolean>(STORAGE_DISABLED)) return;

    const slug = venueSlugForRoom(this.roomId);
    if (!slug) return;

    const ctx = announceContextFor(channel, sync, now, kothState);
    if (!ctx) return;

    const lastKey = await this.storage.get<string>(STORAGE_LAST_KEY);
    if (lastKey === ctx.key) return;

    await this.storage.put(STORAGE_LAST_KEY, ctx.key);

    const result = await this.postAnnounce(apiBase, secret, {
      slug,
      key: ctx.key,
      displayName: ctx.displayName,
      channel,
      ...(ctx.thumbnailUrl ? { thumbnailUrl: ctx.thumbnailUrl } : {}),
    });

    if (result === 'dead') {
      await this.storage.put(STORAGE_DISABLED, true);
    } else if (result === 'missing' && !this.loggedMissingWebhook.has(slug)) {
      this.loggedMissingWebhook.add(slug);
      console.warn('[announce] no webhook configured for', slug);
    }
  }

  async scheduleAlarmAt(
    storage: Party.Room['storage'],
    whenMs: number,
  ): Promise<void> {
    const existing = await storage.getAlarm();
    if (existing == null || whenMs < existing) {
      void storage.setAlarm(whenMs);
    }
  }

  async ensureArmed(
    sync: StageSync | null,
    now: number,
    apiBase: string,
    secret: string | undefined,
    matchup: MatchupStore,
  ): Promise<void> {
    if (!sync) return;
    const channel = stageChannelForRoom(this.roomId);
    if (!channel || !channelAnnounces(channel)) return;
    if (await this.storage.get<boolean>(STORAGE_DISABLED)) return;

    if (isMatchupChannel(channel)) {
      const state = await matchup.ensureChannelLoaded(channel, sync, now, apiBase, secret);
      if (state) {
        await this.announceStep(channel, sync, now, apiBase, secret, state);
      }
      const endsAt = matchup.earliestEndsAt();
      if (endsAt != null) {
        await this.scheduleAlarmAt(this.storage, endsAt);
      }
      return;
    }

    await this.announceStep(channel, sync, now, apiBase, secret);
    const boundary = nextRotationBoundaryMs(channel, now, sync);
    if (boundary != null) {
      await this.scheduleAlarmAt(this.storage, boundary);
    }
  }

  async afterMatchupResolve(
    sync: StageSync | null,
    now: number,
    apiBase: string,
    secret: string | undefined,
    matchup: MatchupStore,
  ): Promise<void> {
    if (!sync) return;
    const channel = stageChannelForRoom(this.roomId);
    if (!channel || !channelAnnounces(channel) || !isMatchupChannel(channel)) return;

    const state = matchup.getCachedChannel(channel);
    if (!state) return;

    await this.announceStep(channel, sync, now, apiBase, secret, state);
    const endsAt = matchup.earliestEndsAt();
    if (endsAt != null) {
      await this.scheduleAlarmAt(this.storage, endsAt);
    }
  }

  async onRotationBoundary(
    sync: StageSync | null,
    now: number,
    apiBase: string,
    secret: string | undefined,
  ): Promise<void> {
    if (!sync) return;
    const channel = stageChannelForRoom(this.roomId);
    if (!channel || !channelAnnounces(channel) || isMatchupChannel(channel)) return;

    await this.announceStep(channel, sync, now, apiBase, secret);
    const boundary = nextRotationBoundaryMs(channel, now, sync);
    if (boundary != null) {
      await this.scheduleAlarmAt(this.storage, boundary);
    }
  }

  roomAnnounces(): boolean {
    const channel = stageChannelForRoom(this.roomId);
    return Boolean(channel && channelAnnounces(channel));
  }
}
