import type * as Party from 'partykit/server';
import { chatterAuthHeader } from '../lib/npcChatter/auth';
import { fetchMatchupVotes } from '../lib/lineup/db';
import { isMatchupChannel } from '../lib/matchup/config';
import { shareB, swapPendingAt } from '../lib/matchup/math';
import { pickChallengerPreview } from '../lib/matchup/lineups';
import {
  localMatchupVotePreview,
  normalizeMatchupStreamerId,
  repairMatchupRoster,
  listMatchupStreamerIds,
} from '../lib/matchup/playlists';
import { createInitialRoomState, resolveAt } from '../lib/matchup/resolve';
import type { MatchupStatePayload, MatchupVote, RoomState, VoteSide } from '../lib/matchup/types';
import type { StageChannel, StageSync } from '../lib/stageVideos';
import { resolveLineupVoterId } from './lineupStore';

export { resolveLineupVoterId };

const STORAGE_PREFIX = 'matchup-v1:';

function storageKey(channel: StageChannel): string {
  return `${STORAGE_PREFIX}${channel}`;
}

function isVoteSide(value: string): value is VoteSide {
  return value === 'a' || value === 'b';
}

function normalizeVotes(raw: Record<string, unknown> | undefined): Record<string, MatchupVote> {
  if (!raw) return {};
  const votes: Record<string, MatchupVote> = {};
  for (const [voterId, entry] of Object.entries(raw)) {
    if (!voterId.trim() || !entry || typeof entry !== 'object') continue;
    const side = (entry as MatchupVote).side;
    const ts = (entry as MatchupVote).ts;
    if (side !== 'a' && side !== 'b') continue;
    if (typeof ts !== 'number' || !Number.isFinite(ts)) continue;
    votes[voterId] = { side, ts };
  }
  return votes;
}

function normalizeRoomState(state: RoomState, sync: StageSync): RoomState {
  const stageId = state.stageId;
  const holder = normalizeMatchupStreamerId(stageId, state.holder, sync);
  const challenger = state.challenger
    ? normalizeMatchupStreamerId(stageId, state.challenger, sync)
    : null;
  const cursors = state.cursors ?? {};
  const voteA = state.voteA ?? state.current.track;
  let voteB = state.voteB ?? null;
  const normalized: RoomState = {
    ...state,
    holder,
    challenger,
    queue: state.queue.map(id => normalizeMatchupStreamerId(stageId, id, sync)),
    cursors,
    votes: normalizeVotes(state.votes),
    voteA,
    voteB,
  };
  if (voteB == null && normalized.challenger) {
    voteB = pickChallengerPreview(
      normalized,
      normalized.challenger,
      sync,
    );
  }
  const repaired = repairMatchupRoster({ ...normalized, voteB }, sync);
  let voteBFinal = repaired.voteB ?? voteB;
  if ((voteBFinal == null || !voteBFinal.youtubeId) && repaired.challenger) {
    voteBFinal = pickChallengerPreview(repaired, repaired.challenger, sync);
  }
  return { ...repaired, voteB: voteBFinal };
}

export class MatchupStore {
  private cache = new Map<StageChannel, RoomState>();

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
        console.error('[matchup] persist api', res.status, await res.text());
      }
    } catch (err) {
      console.error('[matchup] persist fetch failed', err);
    }
  }

  private async hydrateVotesFromApi(
    apiBase: string,
    secret: string | undefined,
    channel: StageChannel,
  ): Promise<Record<string, MatchupVote>> {
    try {
      const params = new URLSearchParams({ roomId: this.roomId, channel, matchup: '1' });
      const res = await fetch(`${apiBase}/api/stage/lineup?${params}`, {
        headers: chatterAuthHeader(secret),
      });
      if (!res.ok) {
        console.error('[matchup] hydrate api', res.status, await res.text());
        return {};
      }
      const data = await res.json() as { votes?: Record<string, MatchupVote> };
      return normalizeVotes(data.votes);
    } catch (err) {
      console.error('[matchup] hydrate fetch failed', err);
      return {};
    }
  }

  private async clearVotesApi(
    apiBase: string,
    secret: string | undefined,
    channel: StageChannel,
  ): Promise<void> {
    await this.persistToApi(apiBase, secret, {
      action: 'matchup-reset-votes',
      roomId: this.roomId,
      channel,
    });
  }

  private async saveChannel(channel: StageChannel, state: RoomState): Promise<void> {
    this.cache.set(channel, state);
    await this.storage.put(storageKey(channel), state);
  }

  async loadChannel(
    channel: StageChannel,
    sync: StageSync,
    now: number,
    apiBase: string,
    secret: string | undefined,
  ): Promise<RoomState> {
    let state = this.cache.get(channel);
    if (!state) {
      const stored = await this.storage.get<RoomState>(storageKey(channel));
      state = stored ?? createInitialRoomState(channel, sync, now);
      state = normalizeRoomState(state, sync);
      const fromDb = await this.hydrateVotesFromApi(apiBase, secret, channel);
      if (Object.keys(fromDb).length) {
        state = { ...state, votes: fromDb };
      }
      await this.saveChannel(channel, state);
    }

    const roster = listMatchupStreamerIds(channel, sync);
    if (roster.length >= 2) {
      const repaired = repairMatchupRoster(normalizeRoomState(state, sync), sync);
      const broken = !repaired.challenger
        || !repaired.voteA?.youtubeId
        || !repaired.voteB?.youtubeId;
      if (broken) {
        state = normalizeRoomState(createInitialRoomState(channel, sync, now), sync);
        await this.saveChannel(channel, state);
      } else {
        state = repaired;
      }
    }

    const before = state;
    const resolved = resolveAt(normalizeRoomState(state, sync), now, sync);
    const boundaryCrossed = resolved.current.startedAt !== before.current.startedAt
      || resolved.current.track.youtubeId !== before.current.track.youtubeId;
    const changed = boundaryCrossed
      || resolved.holder !== before.holder
      || resolved.challenger !== before.challenger
      || resolved.lastResolvedAt !== before.lastResolvedAt;
    if (changed) {
      await this.saveChannel(channel, resolved);
      if (boundaryCrossed) {
        void this.clearVotesApi(apiBase, secret, channel);
      }
    }
    return resolved;
  }

  toPayload(
    channel: StageChannel,
    state: RoomState,
    now: number,
    voterId?: string,
  ): MatchupStatePayload {
    return {
      channel,
      holder: state.holder,
      challenger: state.challenger,
      shareB: shareB(state, now),
      swapPending: swapPendingAt(state, now),
      current: state.current,
      voteA: state.voteA,
      voteB: state.voteB,
      msUntilNext: Math.max(0, state.current.endsAt - now),
      ...(voterId !== undefined ? { myVote: state.votes[voterId]?.side ?? null } : {}),
    };
  }

  async castVote(
    channel: StageChannel,
    voterId: string,
    side: VoteSide,
    sync: StageSync,
    now: number,
    apiBase: string,
    secret: string | undefined,
  ): Promise<MatchupStatePayload> {
    const state = await this.loadChannel(channel, sync, now, apiBase, secret);
    const votes = { ...state.votes, [voterId]: { side, ts: now } };
    const next = { ...state, votes };
    await this.saveChannel(channel, next);
    void this.persistToApi(apiBase, secret, {
      action: 'matchup-vote',
      roomId: this.roomId,
      channel,
      voterId,
      side,
    });
    return this.toPayload(channel, next, now, voterId);
  }

  earliestEndsAt(): number | null {
    let earliest: number | null = null;
    for (const state of this.cache.values()) {
      if (earliest == null || state.current.endsAt < earliest) {
        earliest = state.current.endsAt;
      }
    }
    return earliest;
  }

  async resolveAllDue(
    sync: StageSync | null,
    now: number,
    apiBase: string,
    secret: string | undefined,
    broadcast: (payload: MatchupStatePayload) => void,
  ): Promise<void> {
    if (!sync) return;

    for (const channel of this.cache.keys()) {
      if (!isMatchupChannel(channel)) continue;
      const state = this.cache.get(channel);
      if (!state || now < state.current.endsAt) continue;

      const resolved = await this.loadChannel(channel, sync, now, apiBase, secret);
      broadcast(this.toPayload(channel, resolved, now));
    }
  }

  /** Prefer matchup track-end alarm when it fires sooner than chatter. */
  async scheduleTrackAlarm(storage: Party.Room['storage']): Promise<void> {
    const endsAt = this.earliestEndsAt();
    if (endsAt == null) return;
    const existing = await storage.getAlarm();
    if (existing == null || endsAt < existing) {
      void storage.setAlarm(endsAt);
    }
  }
}

/** Server-side vote hydrate when API GET is unavailable in tests. */
export async function hydrateMatchupVotesFromDb(
  roomId: string,
  channel: StageChannel,
): Promise<Record<string, MatchupVote>> {
  return fetchMatchupVotes(roomId, channel);
}

export function parseMatchupSide(value: string): VoteSide | null {
  return isVoteSide(value) ? value : null;
}
