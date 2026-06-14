import type * as Party from 'partykit/server';
import { encode, type ServerMessage } from '../lib/multiplayer/protocol';
import { filterChatMessage } from '../lib/messageFilter';
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
  HOUSE_MODEL_DEFAULT,
  pickLineBudget,
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
import { getNpcRosterEntry } from '../lib/npcRoster.server';
import type { RoomChatLine } from '../lib/npcChatter/prompts';
import { stageSlugForRoom, streamContextForRoom } from '../lib/npcChatter/roomContext';
import type { StageSync } from '../lib/stageVideos';
import { ierror, ilog, INTERNAL_DEBUG_HEADER, runWithInternalDebug } from '../lib/internalDebug';
import { CHATTER_DEBUG_HEADER, runWithChatterDebug } from '../lib/chatterDebug';

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
  private schedulerOn = false;
  private chatterDisabled = false;
  private npcCooldown = new Map<string, number>();
  private lastPair: [string, string] | null = null;
  private npcWorldX = new Map<string, number>();
  private viewportWidth = 1200;
  private playerViewportWidths = new Map<string, number>();
  /** Cached at construction — `Party.id` / `room` are forbidden inside `onAlarm`. */
  private readonly roomId: string;
  private readonly roomStorage: Party.Room['storage'];
  private readonly env: Record<string, string | undefined>;
  private configLogged = false;

  constructor(private deps: ChatterSchedulerDeps) {
    this.roomId = deps.room.id;
    this.roomStorage = deps.room.storage;
    this.env = deps.room.env as Record<string, string | undefined>;
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
    const delay = jitterMs(FIRST_CONVO_DELAY_MIN_MS, FIRST_CONVO_DELAY_MAX_MS);
    void this.roomStorage.setAlarm(Date.now() + delay);
  }

  onLastPlayer() {
    this.schedulerOn = false;
    this.activeConvo = false;
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

  handleRoomChat(sender: string, text: string) {
    this.appendBuffer(sender, text);
    this.deps.broadcast({ t: 'room-chat', sender, text });

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

  private npcOnCooldown(npcId: string): boolean {
    const until = this.npcCooldown.get(npcId) ?? 0;
    return Date.now() < until;
  }

  private touchNpcCooldown(npcId: string) {
    this.npcCooldown.set(npcId, Date.now() + NPC_REPLY_COOLDOWN_MS);
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
    const ids = this.positionedChatterNpcIds();
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
    this.deps.broadcast({ t: 'room-chat', sender: `npc:${line.npc}`, text: line.text });
    this.appendBuffer(`npc:${line.npc}`, line.text);
    });
  }

  private async runPairConvo() {
    return runWithInternalDebug(this.deps.internalDebug(), async () => {
    return runWithChatterDebug(this.deps.chatterDebug(), async () => {
    if (this.chatterDisabled || this.deps.playerCount() === 0) return;
    if (this.activeConvo) return;

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
      this.deps.broadcast({
        t: 'npc-line',
        convoId,
        npc: line.npc,
        text: line.text,
      });
      this.appendBuffer(`npc:${line.npc}`, line.text);
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

    if (!this.activeConvo && Math.random() < CONVO_PROBABILITY) {
      await this.runPairConvo();
    }

    void this.roomStorage.setAlarm(Date.now() + jitterMs(ALARM_MIN_MS, ALARM_MAX_MS));
  }
}
