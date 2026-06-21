import type * as Party from 'partykit/server';
import { chatterAuthHeader } from '../lib/npcChatter/auth';
import {
  emptyLineupChannelState,
  lineupCountsFromVotes,
  type LineupChannelState,
  type LineupStatePayload,
  type StoredLineupSuggestion,
} from '../lib/lineup/types';
import type { StageChannel, StageVideo } from '../lib/stageVideos';

const STORAGE_PREFIX = 'lineup-v1:';

function storageKey(channel: StageChannel): string {
  return `${STORAGE_PREFIX}${channel}`;
}

function isValidVideo(video: StageVideo | undefined): video is StageVideo {
  return Boolean(video?.id?.trim() && video.title?.trim());
}

export function resolveLineupVoterId(
  connId: string,
  userId: string | undefined,
  playerId: string | undefined,
): string {
  const signedIn = userId?.trim();
  if (signedIn) return signedIn;
  const guest = playerId?.trim();
  if (guest && /^[0-9a-f-]{36}$/i.test(guest)) return guest;
  return `conn:${connId}`;
}

export class LineupStore {
  private cache = new Map<StageChannel, LineupChannelState>();

  constructor(
    private readonly storage: Party.Room['storage'],
    private readonly roomId: string,
  ) {}

  private async persistToApi(
    apiBase: string,
    secret: string | undefined,
    body: Record<string, unknown>,
  ): Promise<void> {
    try {
      const res = await fetch(`${apiBase}/api/stage/lineup`, {
        method: 'POST',
        headers: {
          ...chatterAuthHeader(secret),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error('[lineup] persist api', res.status, await res.text());
      }
    } catch (err) {
      console.error('[lineup] persist fetch failed', err);
    }
  }

  private async hydrateFromApi(
    apiBase: string,
    secret: string | undefined,
    channel: StageChannel,
  ): Promise<LineupChannelState | null> {
    try {
      const params = new URLSearchParams({ roomId: this.roomId, channel });
      const res = await fetch(`${apiBase}/api/stage/lineup?${params}`, {
        headers: chatterAuthHeader(secret),
      });
      if (!res.ok) {
        console.error('[lineup] hydrate api', res.status, await res.text());
        return null;
      }
      const data = await res.json() as LineupChannelState;
      return {
        votes: data.votes ?? {},
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      };
    } catch (err) {
      console.error('[lineup] hydrate fetch failed', err);
      return null;
    }
  }

  private async saveChannel(channel: StageChannel, state: LineupChannelState): Promise<void> {
    this.cache.set(channel, state);
    await this.storage.put(storageKey(channel), state);
  }

  async loadChannel(
    channel: StageChannel,
    apiBase: string,
    secret: string | undefined,
  ): Promise<LineupChannelState> {
    const cached = this.cache.get(channel);
    if (cached) return cached;

    const stored = await this.storage.get<LineupChannelState>(storageKey(channel));
    if (stored) {
      const normalized: LineupChannelState = {
        votes: stored.votes ?? {},
        suggestions: Array.isArray(stored.suggestions) ? stored.suggestions : [],
      };
      this.cache.set(channel, normalized);
      return normalized;
    }

    const fromDb = await this.hydrateFromApi(apiBase, secret, channel);
    const state = fromDb ?? emptyLineupChannelState();
    await this.saveChannel(channel, state);
    return state;
  }

  toPayload(
    channel: StageChannel,
    state: LineupChannelState,
    voterId?: string,
  ): LineupStatePayload {
    return {
      channel,
      counts: lineupCountsFromVotes(state.votes),
      suggestions: state.suggestions,
      ...(voterId !== undefined ? { myVote: state.votes[voterId] ?? null } : {}),
    };
  }

  async castVote(
    channel: StageChannel,
    voterId: string,
    videoId: string,
    apiBase: string,
    secret: string | undefined,
  ): Promise<LineupStatePayload> {
    const state = await this.loadChannel(channel, apiBase, secret);
    const votes = { ...state.votes, [voterId]: videoId };
    const next = { ...state, votes };
    await this.saveChannel(channel, next);
    void this.persistToApi(apiBase, secret, {
      action: 'vote',
      roomId: this.roomId,
      channel,
      voterId,
      videoId,
    });
    return this.toPayload(channel, next, voterId);
  }

  async addSuggestion(
    channel: StageChannel,
    voterId: string,
    video: StageVideo,
    apiBase: string,
    secret: string | undefined,
  ): Promise<LineupStatePayload> {
    if (!isValidVideo(video)) {
      const state = await this.loadChannel(channel, apiBase, secret);
      return this.toPayload(channel, state, voterId);
    }

    const state = await this.loadChannel(channel, apiBase, secret);
    const suggestions = [
      ...state.suggestions.filter(entry => entry.video.id !== video.id),
      { video, addedAt: Date.now() },
    ];
    const next = { ...state, suggestions };
    await this.saveChannel(channel, next);
    void this.persistToApi(apiBase, secret, {
      action: 'suggest',
      roomId: this.roomId,
      channel,
      voterId,
      video,
    });
    return this.toPayload(channel, next, voterId);
  }
}
