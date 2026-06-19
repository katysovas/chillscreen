import type * as Party from 'partykit/server';
import { encode, type ServerMessage } from '../lib/multiplayer/protocol';
import { filterChatMessage, stripNpcChatterDots } from '../lib/messageFilter';
import { chatterAuthHeader } from '../lib/npcChatter/auth';
import { chatterNpcIdsForRoom, matchNpcMention } from '../lib/npcRoster.server';
import {
  ALARM_MAX_MS,
  ALARM_MIN_MS,
  CHAT_BUFFER_SIZE,
  CONVO_PROBABILITY,
  FIRST_CONVO_DELAY_MAX_MS,
  FIRST_CONVO_DELAY_MIN_MS,
  jitterMs,
  linePacingMs,
  MAX_CONVOS_PER_ROOM_PER_HOUR,
  NPC_REPLY_COOLDOWN_MS,
  NPC_REPLY_DELAY_MAX_MS,
  NPC_REPLY_DELAY_MIN_MS,
  SOLO_NPC_ROOM_REPLIES_ENABLED,
  STAGE_CHATTER_LINE_DELAY_MAX_MS,
  STAGE_CHATTER_LINE_DELAY_MIN_MS,
  STAGE_CHATTER_NPC_COOLDOWN_MS,
  STAGE_CHATTER_NPC_MIN,
  STAGE_CHATTER_PROMPT_LINES,
  STAGE_CHATTER_TRIGGER_PROBABILITY,
  STAGE_CHATTER_WAVE_COOLDOWN_MS,
  STAGE_CHATTER_WAVE_DELAY_MAX_MS,
  STAGE_CHATTER_WAVE_DELAY_MIN_MS,
  STAGE_WAVE_DEBOUNCE_MAX_MS,
  STAGE_WAVE_DEBOUNCE_MIN_MS,
  HOUSE_MODEL_DEFAULT,
  pickLineBudget,
  pickStageChatterNpcCount,
} from '../lib/npcChatter/constants';
import { resolveModel } from '../lib/npcChatter/models';
import { chatterApiBase, npcChatterApiUrl } from '../lib/npcChatter/apiBase';
import { pickConversationSeedRemote } from '../lib/npcChatter/seeds';
import { isFestieNpcId } from '../lib/festie/toCharacterDef';
import {
  npcPairEligibleForConvo,
  npcPairInAnyPlayerView,
  type PlayerViewSnapshot,
} from '../lib/npcProximity';
import { getNpcRosterEntry, festieChatterNpcIds } from '../lib/npcRoster.server';
import type { RoomChatLine } from '../lib/npcChatter/prompts';
import { stageSlugForRoom, streamContextForRoom } from '../lib/npcChatter/roomContext';
import type { StageSync } from '../lib/stageVideos';
import { ierror, ilog, INTERNAL_DEBUG_HEADER, runWithInternalDebug } from '../lib/internalDebug';
import { CHATTER_DEBUG_HEADER, runWithChatterDebug } from '../lib/chatterDebug';
import { StageChatterStore } from './stageChatterStore';
import {
  AMBIENT_CHEER_INTERVAL_MAX_MS,
  AMBIENT_CHEER_INTERVAL_MIN_MS,
  pickAmbientCheerLine,
} from '../lib/npcAmbientChat';
import {
  FESTIE_DESCRIBE_SHOUTOUT_FIRST_MAX_MS,
  FESTIE_DESCRIBE_SHOUTOUT_FIRST_MIN_MS,
  FESTIE_DESCRIBE_SHOUTOUT_INTERVAL_MAX_MS,
  FESTIE_DESCRIBE_SHOUTOUT_INTERVAL_MIN_MS,
  FESTIE_SHOUTOUT_COOLDOWN_MS,
} from '../lib/festie/describeShoutouts';
import {
  shouldExcludeFromStageChatter,
  type StageChatterMessage,
} from '../lib/stageChatter/types';

type NpcChatterLine = { npc: string; text: string };

export type ChatterSchedulerDeps = {
  room: Party.Room;
  broadcast: (msg: ServerMessage) => void;
  playerCount: () => number;
  getActivePlayerViews: () => PlayerViewSnapshot[];
  getStageSync: () => StageSync | null;
  /** True when a player joined with ?mute=true — enables internal debug logs. */
  internalDebug: () => boolean;
  /** True when a player joined with ?debug=true — demo seed only. */
  chatterDebug: () => boolean;
};

export class NpcChatterScheduler {
  private chatBuffer: RoomChatLine[] = [];
  private convoHour = 0;
  private convosThisHour = 0;
  private activeConvo = false;
  private activeStageWave = false;
  private schedulerOn = false;
  private chatterDisabled = false;
  private npcCooldown = new Map<string, number>();
  private stageWaveCooldownUntil = 0;
  private stageWaveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPair: [string, string] | null = null;
  private npcWorldX = new Map<string, number>();
  private viewportWidth = 1200;
  private playerViewportWidths = new Map<string, number>();
  /** Cached at construction — `Party.id` / `room` are forbidden inside `onAlarm`. */
  private readonly roomId: string;
  private readonly roomStorage: Party.Room['storage'];
  private readonly env: Record<string, string | undefined>;
  private configLogged = false;
  private nextAmbientCheerAt = 0;
  private nextFestieDescribeShoutoutAt = 0;
  private festieShoutoutCooldown = new Map<string, number>();
  private festieShoutoutFirstPending = true;
  private readonly stageChatter: StageChatterStore;

  constructor(private deps: ChatterSchedulerDeps) {
    this.roomId = deps.room.id;
    this.roomStorage = deps.room.storage;
    this.env = deps.room.env as Record<string, string | undefined>;
    this.stageChatter = new StageChatterStore(deps.room.storage);
  }

  async getStageChatterHistory(): Promise<StageChatterMessage[]> {
    const history = await this.stageChatter.load();
    return history.filter(m => !shouldExcludeFromStageChatter(m.sender, m.text));
  }

  async purgeStageChatterSenders(senders: string[]): Promise<{
    removed: number;
    remaining: StageChatterMessage[];
  }> {
    const result = await this.stageChatter.removeSenders(senders);
    return {
      removed: result.removed,
      remaining: result.remaining.filter(m => !shouldExcludeFromStageChatter(m.sender, m.text)),
    };
  }

  async inspectStageChatterSenders(senders: string[]): Promise<{
    total: number;
    matching: number;
  }> {
    return this.stageChatter.countBySenders(senders);
  }

  async listStageChatterUserSenders() {
    return this.stageChatter.listUserSenders();
  }

  private broadcastSoloNpcLine(npcId: string, text: string): void {
    const cleaned = stripNpcChatterDots(text);
    if (!cleaned.trim()) return;
    this.deps.broadcast({
      t: 'room-chat',
      sender: `npc:${npcId}`,
      text: cleaned,
      ts: Date.now(),
    });
  }

  private async persistAndBroadcastRoomChat(
    sender: string,
    text: string,
    userId?: string | null,
  ): Promise<boolean> {
    if (sender.startsWith('npc:')) {
      this.broadcastSoloNpcLine(sender.slice(4), text);
      return true;
    }
    const { entry, added } = await this.stageChatter.append(sender, text, Date.now(), userId);
    if (!added) return false;
    this.deps.broadcast({ t: 'room-chat', sender, text, ts: entry.ts });
    return true;
  }

  private async persistAndBroadcastNpcLine(convoId: string, npc: string, text: string): Promise<boolean> {
    const cleaned = stripNpcChatterDots(text);
    const { entry, added } = await this.stageChatter.append(`npc:${npc}`, cleaned);
    if (!added) return false;
    this.deps.broadcast({ t: 'npc-line', convoId, npc, text: cleaned, ts: entry.ts });
    return true;
  }

  private async broadcastRoomTyping(sender: string, typing: boolean) {
    this.deps.broadcast({ t: 'room-typing', sender, typing });
  }

  private logConfigOnce() {
    if (this.configLogged) return;
    this.configLogged = true;
    runWithInternalDebug(this.deps.internalDebug(), () => {
      const hasOpenRouter = Boolean(this.env.OPENROUTER_API_KEY?.trim());
      ilog('[npc-chatter] party env', {
        hasOpenRouterKey: hasOpenRouter,
        hasChatterSecret: Boolean(this.env.NPC_CHATTER_SECRET?.trim()),
        chatterApiUrl: this.apiUrl(),
      });
      if (!hasOpenRouter) {
        ierror(
          '[npc-chatter] OPENROUTER_API_KEY missing on PartyKit — run: npm run party:deploy (loads .env.local)',
        );
      }
    });
  }

  setChatterDisabled(disabled: boolean) {
    if (disabled === this.chatterDisabled) return;
    this.chatterDisabled = disabled;
    if (disabled) {
      this.schedulerOn = false;
      this.activeConvo = false;
      this.activeStageWave = false;
      if (this.stageWaveDebounceTimer) {
        clearTimeout(this.stageWaveDebounceTimer);
        this.stageWaveDebounceTimer = null;
      }
      void this.roomStorage.setAlarm(Date.now() + 86_400_000);
      return;
    }
    if (this.deps.playerCount() > 0) {
      this.schedulerOn = false;
      this.onFirstPlayer();
    }
  }

  onFirstPlayer() {
    this.logConfigOnce();
    if (this.chatterDisabled) return;
    if (this.schedulerOn) return;
    this.schedulerOn = true;
    this.scheduleNextAmbientCheer();
    this.scheduleNextFestieDescribeShoutout(true);
    const delay = jitterMs(FIRST_CONVO_DELAY_MIN_MS, FIRST_CONVO_DELAY_MAX_MS);
    void this.roomStorage.setAlarm(Date.now() + delay);
  }

  onLastPlayer() {
    this.schedulerOn = false;
    this.activeConvo = false;
    this.activeStageWave = false;
    if (this.stageWaveDebounceTimer) {
      clearTimeout(this.stageWaveDebounceTimer);
      this.stageWaveDebounceTimer = null;
    }
    // Push alarm far out — empty room = zero LLM calls.
    void this.roomStorage.setAlarm(Date.now() + 86_400_000);
  }

  updateNpcPositions(
    positions: { id: string; worldX: number }[],
    viewportWidth: number,
    playerId?: string,
  ) {
    if (viewportWidth > 0) {
      this.viewportWidth = viewportWidth;
      if (playerId) this.playerViewportWidths.set(playerId, viewportWidth);
    }
    for (const p of positions) {
      if (p.id && Number.isFinite(p.worldX)) {
        this.npcWorldX.set(p.id, p.worldX);
      }
    }
  }

  clearPlayerViewport(playerId: string) {
    this.playerViewportWidths.delete(playerId);
  }

  getPlayerViewportWidth(playerId: string): number | undefined {
    return this.playerViewportWidths.get(playerId);
  }

  getViewportWidth(): number {
    return this.viewportWidth;
  }

  appendBuffer(sender: string, text: string) {
    this.chatBuffer.push({ sender, text });
    if (this.chatBuffer.length > CHAT_BUFFER_SIZE) {
      this.chatBuffer = this.chatBuffer.slice(-CHAT_BUFFER_SIZE);
    }
  }

  handleRoomChat(sender: string, text: string, userId?: string | null) {
    if (shouldExcludeFromStageChatter(sender, text)) {
      this.deps.broadcast({ t: 'room-chat', sender, text });
    } else {
      this.appendBuffer(sender, text);
      void this.persistAndBroadcastRoomChat(sender, text, userId);
    }

    if (!shouldExcludeFromStageChatter(sender, text)) {
      this.scheduleStageChatterWave();
    }

    if (!SOLO_NPC_ROOM_REPLIES_ENABLED || this.chatterDisabled) return;

    const npcId = matchNpcMention(text, this.roomId);
    if (!npcId) return;
    if (this.npcOnCooldown(npcId)) return;
    if (this.activeConvo) return;
    // Cool down immediately so rapid messages don't queue parallel LLM calls.
    this.touchNpcCooldown(npcId);

    const delay = jitterMs(NPC_REPLY_DELAY_MIN_MS, NPC_REPLY_DELAY_MAX_MS);
    setTimeout(() => {
      if (this.deps.playerCount() === 0) return;
      if (this.activeConvo) return;
      void this.runSingleReply(npcId, text);
    }, delay);
  }

  private scheduleStageChatterWave() {
    if (this.chatterDisabled || this.activeConvo || this.activeStageWave) return;
    if (Date.now() < this.stageWaveCooldownUntil) return;
    if (this.stageWaveDebounceTimer) clearTimeout(this.stageWaveDebounceTimer);
    this.stageWaveDebounceTimer = setTimeout(() => {
      this.stageWaveDebounceTimer = null;
      void this.runStageChatterWave();
    }, jitterMs(STAGE_WAVE_DEBOUNCE_MIN_MS, STAGE_WAVE_DEBOUNCE_MAX_MS));
  }

  private pickStageChatterNpcs(excludeNpcId?: string): string[] {
    const ids = this.positionedChatterNpcIds().filter(
      id => id !== excludeNpcId && this.festieAutopilotChatterEligible(id),
    );
    if (ids.length < STAGE_CHATTER_NPC_MIN) return [];

    const recentNpcSpeakers = new Set(
      this.chatBuffer
        .slice(-STAGE_CHATTER_PROMPT_LINES)
        .filter(line => line.sender.startsWith('npc:'))
        .map(line => line.sender.slice(4)),
    );

    let pool = ids.filter(id => !recentNpcSpeakers.has(id));
    if (pool.length < STAGE_CHATTER_NPC_MIN) pool = ids;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(pickStageChatterNpcCount(), shuffled.length));
  }

  private touchStageNpcCooldown(npcId: string) {
    this.npcCooldown.set(npcId, Date.now() + STAGE_CHATTER_NPC_COOLDOWN_MS);
  }

  private async runStageChatterWave() {
    return runWithInternalDebug(this.deps.internalDebug(), async () => {
      if (this.chatterDisabled || this.deps.playerCount() === 0) return;
      if (this.activeConvo || this.activeStageWave) return;
      if (Date.now() < this.stageWaveCooldownUntil) return;
      if (Math.random() > STAGE_CHATTER_TRIGGER_PROBABILITY) return;

      const recent = this.chatBuffer.slice(-STAGE_CHATTER_PROMPT_LINES);
      if (recent.length === 0) return;

      const lastSpeaker = recent[recent.length - 1]?.sender;
      const excludeNpcId = lastSpeaker?.startsWith('npc:') ? lastSpeaker.slice(4) : undefined;
      const participants = this.pickStageChatterNpcs(excludeNpcId);
      if (participants.length < STAGE_CHATTER_NPC_MIN) return;

      this.activeStageWave = true;
      const { streamTitle, channelName } = this.streamCtx();

      try {
        await new Promise(r => setTimeout(
          r,
          jitterMs(STAGE_CHATTER_WAVE_DELAY_MIN_MS, STAGE_CHATTER_WAVE_DELAY_MAX_MS),
        ));

        for (let i = 0; i < participants.length; i++) {
          if (this.deps.playerCount() === 0) break;
          if (this.activeConvo) break;

          const npcId = participants[i]!;
          if (this.npcOnCooldown(npcId)) continue;

          void this.broadcastRoomTyping(`npc:${npcId}`, true);
          const lines = await this.fetchChatter({
            mode: 'stage',
            stage: stageSlugForRoom(this.roomId),
            npc: npcId,
            recentChat: this.chatBuffer.slice(-STAGE_CHATTER_PROMPT_LINES),
            streamTitle,
            channelName,
          });
          void this.broadcastRoomTyping(`npc:${npcId}`, false);

          const line = lines?.[0];
          if (!line?.text) continue;

          this.touchStageNpcCooldown(npcId);
          const sent = await this.persistAndBroadcastRoomChat(`npc:${line.npc}`, line.text);
          if (sent) this.appendBuffer(`npc:${line.npc}`, line.text);

          if (i < participants.length - 1) {
            await new Promise(r => setTimeout(
              r,
              jitterMs(STAGE_CHATTER_LINE_DELAY_MIN_MS, STAGE_CHATTER_LINE_DELAY_MAX_MS),
            ));
          }
        }
      } finally {
        this.activeStageWave = false;
        this.stageWaveCooldownUntil = Date.now() + STAGE_CHATTER_WAVE_COOLDOWN_MS;
      }
    });
  }

  private npcOnCooldown(npcId: string): boolean {
    const until = this.npcCooldown.get(npcId) ?? 0;
    return Date.now() < until;
  }

  private touchNpcCooldown(npcId: string) {
    this.npcCooldown.set(npcId, Date.now() + NPC_REPLY_COOLDOWN_MS);
  }

  private scheduleNextAmbientCheer() {
    this.nextAmbientCheerAt = Date.now()
      + jitterMs(AMBIENT_CHEER_INTERVAL_MIN_MS, AMBIENT_CHEER_INTERVAL_MAX_MS);
  }

  private scheduleNextFestieDescribeShoutout(first = false) {
    const useFirst = first && this.festieShoutoutFirstPending;
    const min = useFirst
      ? FESTIE_DESCRIBE_SHOUTOUT_FIRST_MIN_MS
      : FESTIE_DESCRIBE_SHOUTOUT_INTERVAL_MIN_MS;
    const max = useFirst
      ? FESTIE_DESCRIBE_SHOUTOUT_FIRST_MAX_MS
      : FESTIE_DESCRIBE_SHOUTOUT_INTERVAL_MAX_MS;
    if (useFirst) this.festieShoutoutFirstPending = false;
    this.nextFestieDescribeShoutoutAt = Date.now() + jitterMs(min, max);
  }

  private festieShoutoutOnCooldown(npcId: string): boolean {
    return Date.now() < (this.festieShoutoutCooldown.get(npcId) ?? 0);
  }

  private touchFestieShoutoutCooldown(npcId: string) {
    this.festieShoutoutCooldown.set(npcId, Date.now() + FESTIE_SHOUTOUT_COOLDOWN_MS);
  }

  private festieAutopilotChatterEligible(npcId: string): boolean {
    if (!isFestieNpcId(npcId)) return true;
    return Boolean(getNpcRosterEntry(npcId)?.autopilotActive);
  }

  private pickFestieDescribeShoutoutNpc(): string | null {
    const positioned = new Set(this.positionedChatterNpcIds());
    const ids = festieChatterNpcIds().filter(id => {
      if (!positioned.has(id)) return false;
      const entry = getNpcRosterEntry(id);
      return Boolean(entry?.describeNotes?.trim() && entry.autopilotActive);
    });
    if (ids.length === 0) return null;
    const available = ids.filter(id => !this.festieShoutoutOnCooldown(id));
    const pool = available.length > 0 ? available : ids;
    return pool[Math.floor(Math.random() * pool.length)]!;
  }

  private async runFestieDescribeShoutout() {
    if (this.chatterDisabled || this.deps.playerCount() === 0) return;
    if (this.activeConvo) return;

    const npcId = this.pickFestieDescribeShoutoutNpc();
    if (!npcId) return;

    void this.broadcastRoomTyping(`npc:${npcId}`, true);
    const lines = await this.fetchChatter({
      mode: 'festie-shoutout',
      stage: stageSlugForRoom(this.roomId),
      npc: npcId,
    });
    void this.broadcastRoomTyping(`npc:${npcId}`, false);

    const line = lines?.[0];
    if (!line?.text) return;

    this.touchFestieShoutoutCooldown(npcId);
    const sent = await this.persistAndBroadcastRoomChat(`npc:${line.npc}`, line.text);
    if (sent) this.appendBuffer(`npc:${line.npc}`, line.text);
  }

  private async runAmbientCheer() {
    if (this.chatterDisabled || this.deps.playerCount() === 0) return;
    if (this.activeConvo || this.activeStageWave) return;

    const ids = this.positionedChatterNpcIds().filter(id => this.festieAutopilotChatterEligible(id));
    if (ids.length === 0) return;

    const available = ids.filter(id => !this.npcOnCooldown(id));
    const pool = available.length > 0 ? available : ids;
    const npcId = pool[Math.floor(Math.random() * pool.length)]!;
    const line = pickAmbientCheerLine();

    const sent = await this.persistAndBroadcastRoomChat(`npc:${npcId}`, line);
    if (sent) this.appendBuffer(`npc:${npcId}`, line);
  }

  private bumpHourlyCap(): boolean {
    const hour = Math.floor(Date.now() / 3_600_000);
    if (hour !== this.convoHour) {
      this.convoHour = hour;
      this.convosThisHour = 0;
    }
    if (this.convosThisHour >= MAX_CONVOS_PER_ROOM_PER_HOUR) return false;
    this.convosThisHour++;
    return true;
  }

  /** NPCs the client has actually spawned — positions come from npc-positions only. */
  private positionedChatterNpcIds(): string[] {
    const eligible = new Set(chatterNpcIdsForRoom(this.roomId));
    return [...this.npcWorldX.entries()]
      .filter(([id, wx]) => eligible.has(id) && Number.isFinite(wx))
      .map(([id]) => id);
  }

  private pickNpcPair(): [string, string] | null {
    const ids = this.positionedChatterNpcIds().filter(id => this.festieAutopilotChatterEligible(id));
    if (ids.length < 2) return null;

    const views = this.deps.getActivePlayerViews();
    if (views.length === 0) return null;

    const ranked: { pair: [string, string]; dist: number }[] = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]!;
        const b = ids[j]!;
        const wxA = this.npcWorldX.get(a)!;
        const wxB = this.npcWorldX.get(b)!;
        const festiePair = isFestieNpcId(a) || isFestieNpcId(b);
        const eligible = festiePair
          ? npcPairInAnyPlayerView(wxA, wxB, views)
          : npcPairEligibleForConvo(wxA, wxB, views);
        if (!eligible) continue;
        ranked.push({
          pair: a < b ? [a, b] : [b, a],
          dist: Math.abs(wxA - wxB),
        });
      }
    }
    if (ranked.length === 0) return null;

    ranked.sort((x, y) => x.dist - y.dist);
    for (const { pair } of ranked) {
      if (
        this.lastPair &&
        this.lastPair[0] === pair[0] &&
        this.lastPair[1] === pair[1] &&
        ranked.length > 1
      ) {
        continue;
      }
      this.lastPair = pair;
      return pair;
    }
    this.lastPair = ranked[0]!.pair;
    return ranked[0]!.pair;
  }

  private chatterApiBase(): string {
    return chatterApiBase(this.env);
  }

  private apiUrl(): string {
    return npcChatterApiUrl(this.env);
  }

  private async fetchChatter(body: object): Promise<NpcChatterLine[] | null> {
    return runWithInternalDebug(this.deps.internalDebug(), async () => {
    return runWithChatterDebug(this.deps.chatterDebug(), async () => {
    try {
      const debugHeaders: Record<string, string> = {
        ...(this.deps.internalDebug() ? { [INTERNAL_DEBUG_HEADER]: 'true' } : {}),
        ...(this.deps.chatterDebug() ? { [CHATTER_DEBUG_HEADER]: 'true' } : {}),
      };
      const res = await fetch(this.apiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...chatterAuthHeader(this.env.NPC_CHATTER_SECRET),
          ...debugHeaders,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const bodyText = await res.text();
        ierror('[npc-chatter] party → API failed', res.status, this.apiUrl(), bodyText.slice(0, 400));
        return null;
      }
      const data = await res.json() as { lines?: NpcChatterLine[] };
      return data.lines ?? null;
    } catch (err) {
      ierror('[npc-chatter] fetch failed', err);
      return null;
    }
    });
    });
  }

  private streamCtx() {
    const sync = this.deps.getStageSync();
    if (!sync) {
      return { streamTitle: null as string | null, channelName: 'the stage' };
    }
    return streamContextForRoom(this.roomId, sync);
  }

  private async runSingleReply(npcId: string, triggerText: string) {
    return runWithInternalDebug(this.deps.internalDebug(), async () => {
    if (this.chatterDisabled || this.deps.playerCount() === 0) return;
    const { streamTitle, channelName } = this.streamCtx();
    const lines = await this.fetchChatter({
      mode: 'reply',
      stage: stageSlugForRoom(this.roomId),
      npc: npcId,
      triggerText,
      recentChat: this.chatBuffer.slice(-15),
      streamTitle,
      channelName,
    });
    const line = lines?.[0];
    if (!line) {
      ierror('[npc-chatter] party single reply empty', { npcId, triggerText: triggerText.slice(0, 80) });
      return;
    }
    await this.persistAndBroadcastRoomChat(`npc:${line.npc}`, line.text);
    });
  }

  private async runPairConvo() {
    return runWithInternalDebug(this.deps.internalDebug(), async () => {
    return runWithChatterDebug(this.deps.chatterDebug(), async () => {
    if (this.chatterDisabled || this.deps.playerCount() === 0) return;
    if (this.activeConvo || this.activeStageWave) return;

    const pair = this.pickNpcPair();
    if (!pair) return;

    const [npcA, npcB] = pair;
    const wxA = this.npcWorldX.get(npcA);
    const wxB = this.npcWorldX.get(npcB);
    if (wxA == null || wxB == null) return;
    const festiePair = isFestieNpcId(npcA) || isFestieNpcId(npcB);
    const views = this.deps.getActivePlayerViews();
    const inRange = festiePair
      ? npcPairInAnyPlayerView(wxA, wxB, views)
      : npcPairEligibleForConvo(wxA, wxB, views);
    if (!inRange) return;
    if (!this.bumpHourlyCap()) return;

    const lineBudget = pickLineBudget();
    const { streamTitle, channelName } = this.streamCtx();
    const seedPick = await pickConversationSeedRemote(
      streamTitle,
      channelName,
      stageSlugForRoom(this.roomId),
      this.chatterApiBase(),
      this.env.NPC_CHATTER_SECRET,
    );
    if (seedPick.kind === 'demo') {
      ilog('[npc-chatter] using demo seed', seedPick.seed.slice(0, 80));
    }
    const houseModel = this.env.HOUSE_MODEL?.trim() || HOUSE_MODEL_DEFAULT;
    const rosterA = getNpcRosterEntry(npcA);
    const rosterB = getNpcRosterEntry(npcB);
    const models = {
      [npcA]: resolveModel(rosterA?.modelId, houseModel),
      [npcB]: resolveModel(rosterB?.modelId, houseModel),
    };

    this.activeConvo = true;
    const convoId = `${Date.now()}-${npcA}-${npcB}`;
    this.deps.broadcast({
      t: 'npc-convo-start',
      convoId,
      participants: [npcA, npcB],
      meta: { seedKind: seedPick.kind, seed: seedPick.seed, models },
    });

    const lines = await this.fetchChatter({
      stage: stageSlugForRoom(this.roomId),
      npcA,
      npcB,
      seed: seedPick.seed,
      lineBudget,
      recentChat: this.chatBuffer.slice(-15),
      streamTitle,
      channelName,
    });

    if (!lines || lines.length < 2) {
      ierror('[npc-chatter] pair generation failed', {
        npcA,
        npcB,
        lineCount: lines?.length ?? 0,
      });
      this.deps.broadcast({ t: 'npc-convo-end', convoId });
      this.activeConvo = false;
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        await new Promise(r => setTimeout(r, linePacingMs(lines[i - 1]!.text)));
      }
      if (this.deps.playerCount() === 0) {
        this.deps.broadcast({ t: 'npc-convo-end', convoId });
        this.activeConvo = false;
        return;
      }
      const line = lines[i]!;
      const sent = await this.persistAndBroadcastNpcLine(convoId, line.npc, line.text);
      if (sent) this.appendBuffer(`npc:${line.npc}`, line.text);
    }

    this.deps.broadcast({ t: 'npc-convo-end', convoId });
    this.activeConvo = false;
    });
    });
  }

  async onAlarm() {
    if (this.deps.playerCount() === 0) {
      this.onLastPlayer();
      return;
    }
    if (this.chatterDisabled || !this.schedulerOn) {
      void this.roomStorage.setAlarm(Date.now() + 86_400_000);
      return;
    }

    if (Date.now() >= this.nextAmbientCheerAt) {
      await this.runAmbientCheer();
      this.scheduleNextAmbientCheer();
    }

    if (Date.now() >= this.nextFestieDescribeShoutoutAt) {
      await this.runFestieDescribeShoutout();
      this.scheduleNextFestieDescribeShoutout();
    }

    if (!this.activeConvo && !this.activeStageWave && Math.random() < CONVO_PROBABILITY) {
      await this.runPairConvo();
    }

    void this.roomStorage.setAlarm(Date.now() + jitterMs(ALARM_MIN_MS, ALARM_MAX_MS));
  }
}
