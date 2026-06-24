'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterDef } from '@/components/game/characters';
import type { CharacterLoadout } from '@/components/game/characters/loadout';
import type { UserStagePublic } from '@/lib/stages/types';
import { buildAutopilotAmbientContext } from '@/lib/autopilot/ambientContext';
import {
  clearAutopilotEvent,
  endAutopilotEvent,
  isAutopilotEventBusy,
  isOwnerFestieOccupied,
  tryBeginAutopilotEvent,
} from '@/lib/autopilot/busy';
import { claimAutopilotEasel } from '@/lib/autopilot/easelClaim';
import { pickAutopilotDrawPrompt } from '@/lib/autopilot/drawing';
import {
  buildAutopilotFlexDetail,
  pickAutopilotDropReactionLine,
  pickAutopilotEaselLine,
  pickAutopilotFlexLine,
  pickAutopilotHumanApproachLine,
  pickAutopilotLineupVoteLine,
  pickAutopilotNapLine,
  pickAutopilotNpcChatFollowup,
  pickAutopilotNpcChatOpener,
  pickAutopilotPartyPropLine,
  pickAutopilotRivalryLine,
} from '@/lib/autopilot/lines';
import { pickAutopilotLineupVote } from '@/lib/autopilot/lineupVote';
import { pickAutopilotPartyProp } from '@/lib/autopilot/partyProps';
import { fetchAutopilotDescribeShoutout } from '@/lib/autopilot/shoutout';
import {
  AUTOPILOT_RPS_ROUNDS,
  AUTOPILOT_RPS_TIMING,
  formatRpsOpponentReveal,
  formatRpsShootReveal,
  pickRpsCelebrationLine,
  pickRpsChoice,
  pickRpsGameIntroLine,
  pickRpsLossLine,
  pickRpsSeriesWinLine,
  pickRpsTieLine,
  resolveRps,
  rpsEmoji,
} from '@/lib/autopilot/rps';
import {
  AUTOPILOT_DESCRIBE_SHOUTOUT_WINDOW_MS,
  AUTOPILOT_EASEL_WINDOW_MS,
  AUTOPILOT_FLEX_WINDOW_MS,
  AUTOPILOT_HUMAN_APPROACH_WINDOW_MS,
  AUTOPILOT_JUMP_BURST_WINDOW_MS,
  AUTOPILOT_LINEUP_VOTE_WINDOW_MS,
  AUTOPILOT_NAP_AFTER_MS,
  AUTOPILOT_NPC_CHAT_WINDOW_MS,
  AUTOPILOT_PARTY_PROP_WINDOW_MS,
  AUTOPILOT_RIVALRY_WINDOW_MS,
  AUTOPILOT_RPS_TRIGGER_PROBABILITY,
  AUTOPILOT_RPS_WINDOW_MS,
  nextAutopilotAtMs,
  nextAutopilotNapUntil,
} from '@/lib/autopilot/timing';
import { easelSlotWorldX } from '@/lib/easel/layout';
import type { EaselSessionSync } from '@/lib/easel/types';
import { notifyEaselUpdated } from '@/lib/easel/notifyUpdated';
import type { FestieOwner } from '@/lib/festie/types';
import { isFestieNpcId } from '@/lib/festie/toCharacterDef';
import type { Multiplayer } from '@/lib/multiplayer/useMultiplayer';
import { fetchNpcReply } from '@/lib/npcChatClient';
import { npcTouchDistPx } from '@/lib/npcProximity';
import { crowdSpawnWorldX, type StageAnchorKind } from '@/lib/stageAnchor';
import type { StageChannel } from '@/lib/stageVideos';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isBuzNpc } from '@/lib/vendorShop';
import { snapNpcPairForConvo, releaseNpcConvoSnap } from '@/lib/npcConvoSnap';
import type { RoomChatterState } from '@/components/game/hooks/useRoomChatter';

type Params = {
  enabled: boolean;
  ownerFestieNpcId: string | null;
  ownerFestieIndex: number;
  ownerFestie: FestieOwner | null;
  effectiveNpcCast: CharacterDef[];
  easelDrawingEnabled: boolean;
  easelStageSlug: string;
  easelLayoutRoute: VenueRoute;
  activeEaselSession: EaselSessionSync | null | undefined;
  curatedStageChannel: StageChannel | null;
  stageName: string | null;
  creatorStage: UserStagePublic | null;
  stagePlaybackChannel: StageChannel | null;
  cinemaNowPlaying: string | null;
  concertNowPlaying: string | null;
  playerName: string | null;
  playerLoadout: CharacterLoadout;
  playerCoins: number;
  gndScrollWorldOff: number;
  vendorAttractWx: number | undefined;
  mpRef: React.RefObject<Multiplayer | undefined>;
  npcWorldXRefs: React.RefObject<number[]>;
  roomChatterRef: React.RefObject<RoomChatterState>;
  chatNpcDrawingsRef: React.RefObject<import('@/lib/easel/types').ChatNpcDrawingSession[]>;
  handleVendorPurchase: (itemId: string) => Promise<boolean>;
  setChatNpcDrawings: React.Dispatch<React.SetStateAction<import('@/lib/easel/types').ChatNpcDrawingSession[]>>;
  sendLineupVote: ((channel: StageChannel, videoId: string) => void) | null;
  lineupMyVote: string | null;
};

export function useAutopilotBehaviors({
  enabled,
  ownerFestieNpcId,
  ownerFestieIndex,
  ownerFestie,
  effectiveNpcCast,
  easelDrawingEnabled,
  easelStageSlug,
  easelLayoutRoute,
  activeEaselSession,
  curatedStageChannel,
  stageName,
  creatorStage,
  stagePlaybackChannel,
  cinemaNowPlaying,
  concertNowPlaying,
  playerName,
  playerLoadout,
  playerCoins,
  gndScrollWorldOff,
  vendorAttractWx,
  mpRef,
  npcWorldXRefs,
  roomChatterRef,
  chatNpcDrawingsRef,
  handleVendorPurchase,
  setChatNpcDrawings,
  sendLineupVote,
  lineupMyVote,
}: Params) {
  const [attractWx, setAttractWx] = useState<number | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [jumpBurstKey, setJumpBurstKey] = useState(0);
  const [rpsPairIds, setRpsPairIds] = useState<readonly [string, string] | null>(null);

  const sessionStartedAtRef = useRef(0);
  const napUntilRef = useRef(0);
  const npcChatAtRef = useRef(0);
  const easelAtRef = useRef(0);
  const partyPropAtRef = useRef(0);
  const humanAtRef = useRef(0);
  const rivalryAtRef = useRef(0);
  const lineupVoteAtRef = useRef(0);
  const describeAtRef = useRef(0);
  const jumpBurstAtRef = useRef(0);
  const rpsAtRef = useRef(0);
  const flexAtRef = useRef(0);
  const lastNowPlayingRef = useRef<string | null>(null);
  const stageAttractUntilRef = useRef(0);
  const humanAttractUntilRef = useRef(0);
  const npcChatAttractUntilRef = useRef(0);
  const easelAttractUntilRef = useRef(0);

  const triggerJumpBurst = useCallback(() => {
    setJumpBurstKey(k => k + 1);
  }, []);

  const shoutOwner = useCallback((text: string) => {
    const ownerId = ownerFestieNpcId;
    if (!ownerId) return;
    roomChatterRef.current?.handleNpcShout(ownerId, text);
  }, [ownerFestieNpcId, roomChatterRef]);

  const flexShout = useCallback((kind: 'purchase' | 'loss' | 'draw' | 'vote' | 'coins', label: string) => {
    const now = Date.now();
    if (now < flexAtRef.current) return;
    flexAtRef.current = now + AUTOPILOT_FLEX_WINDOW_MS;
    shoutOwner(pickAutopilotFlexLine(buildAutopilotFlexDetail(kind, label)));
  }, [shoutOwner]);

  const recordFlexPurchase = useCallback((itemName: string) => {
    flexShout('purchase', itemName.toLowerCase());
  }, [flexShout]);

  const recordFlexLoss = useCallback((itemName: string) => {
    flexShout('loss', itemName.toLowerCase());
  }, [flexShout]);

  const recordFlexDraw = useCallback((subject: string) => {
    flexShout('draw', subject.toLowerCase());
  }, [flexShout]);

  useEffect(() => {
    if (!enabled) {
      sessionStartedAtRef.current = 0;
      napUntilRef.current = 0;
      setAttractWx(undefined);
      setPaused(false);
      setRpsPairIds(null);
      clearAutopilotEvent();
      releaseNpcConvoSnap();
      return;
    }
    const now = Date.now();
    sessionStartedAtRef.current = now;
    npcChatAtRef.current = nextAutopilotAtMs(AUTOPILOT_NPC_CHAT_WINDOW_MS, now);
    easelAtRef.current = nextAutopilotAtMs(AUTOPILOT_EASEL_WINDOW_MS, now);
    partyPropAtRef.current = nextAutopilotAtMs(AUTOPILOT_PARTY_PROP_WINDOW_MS, now);
    humanAtRef.current = nextAutopilotAtMs(AUTOPILOT_HUMAN_APPROACH_WINDOW_MS, now);
    rivalryAtRef.current = nextAutopilotAtMs(AUTOPILOT_RIVALRY_WINDOW_MS, now);
    lineupVoteAtRef.current = nextAutopilotAtMs(AUTOPILOT_LINEUP_VOTE_WINDOW_MS, now);
    describeAtRef.current = nextAutopilotAtMs(AUTOPILOT_DESCRIBE_SHOUTOUT_WINDOW_MS, now);
    jumpBurstAtRef.current = nextAutopilotAtMs(AUTOPILOT_JUMP_BURST_WINDOW_MS, now);
    rpsAtRef.current = nextAutopilotAtMs(AUTOPILOT_RPS_WINDOW_MS, now);
    flexAtRef.current = 0;
    lastNowPlayingRef.current = null;
  }, [enabled, ownerFestieNpcId]);

  const resolveAttract = useCallback(() => {
    const now = Date.now();
    if (npcChatAttractUntilRef.current > now) return;
    if (humanAttractUntilRef.current > now) return;
    if (easelAttractUntilRef.current > now) return;
    if (stageAttractUntilRef.current > now) return;
    setAttractWx(vendorAttractWx);
  }, [vendorAttractWx]);

  const runNpcChatSpree = useCallback(async (
    ownerId: string,
    festieIdx: number,
    targetIdx: number,
  ) => {
    if (!tryBeginAutopilotEvent('npc-chat')) return;
    setPaused(true);

    const target = effectiveNpcCast[targetIdx];
    const targetWx = npcWorldXRefs.current?.[targetIdx];
    if (!target || !Number.isFinite(targetWx)) {
      endAutopilotEvent('npc-chat');
      setPaused(false);
      return;
    }

    try {
      npcChatAttractUntilRef.current = Date.now() + 12_000;
      setAttractWx(targetWx!);

      await new Promise(r => setTimeout(r, 2_800));
      if (!enabled) return;

      const opener = pickAutopilotNpcChatOpener();
      shoutOwner(opener);

      const reply1 = await fetchNpcReply({
        characterId: target.id,
        playerName: playerName ?? 'festie',
        message: opener,
        cinemaNowPlaying,
        concertNowPlaying,
      }, new AbortController().signal);

      if (reply1?.reply?.trim()) {
        roomChatterRef.current?.handleNpcShout(target.id, reply1.reply!);
      }

      await new Promise(r => setTimeout(r, 2_400));
      const followup = pickAutopilotNpcChatFollowup();
      shoutOwner(followup);

      const reply2 = await fetchNpcReply({
        characterId: target.id,
        playerName: playerName ?? 'festie',
        message: followup,
        history: [
          { role: 'user', content: opener },
          ...(reply1?.reply ? [{ role: 'assistant' as const, content: reply1.reply }] : []),
          { role: 'user', content: followup },
        ],
        cinemaNowPlaying,
        concertNowPlaying,
      }, new AbortController().signal);

      if (reply2?.reply?.trim()) {
        roomChatterRef.current?.handleNpcShout(target.id, reply2.reply!);
      }

      await new Promise(r => setTimeout(r, 3_500));
    } finally {
      npcChatAttractUntilRef.current = 0;
      endAutopilotEvent('npc-chat');
      setPaused(false);
      resolveAttract();
    }
  }, [
    concertNowPlaying,
    cinemaNowPlaying,
    effectiveNpcCast,
    enabled,
    npcWorldXRefs,
    playerName,
    resolveAttract,
    roomChatterRef,
    shoutOwner,
  ]);

  const runHumanApproach = useCallback(async (ownerId: string, festieIdx: number) => {
    if (!tryBeginAutopilotEvent('human-approach')) return;

    try {
      const roster = mpRef.current?.remoteStateRef.current;
      if (!roster || roster.size === 0) return;

      let bestId: string | null = null;
      let bestWx = NaN;
      let bestDist = Infinity;
      const festieWx = npcWorldXRefs.current?.[festieIdx];
      if (!Number.isFinite(festieWx)) return;

      for (const [pid, st] of roster) {
        const dist = Math.abs(st.worldX - festieWx!);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = pid;
          bestWx = st.worldX;
        }
      }
      if (!bestId || !Number.isFinite(bestWx)) return;

      humanAttractUntilRef.current = Date.now() + 10_000;
      setAttractWx(bestWx);

      await new Promise(r => setTimeout(r, 2_500));
      const peerName = roster.get(bestId)?.name?.trim() ?? null;
      shoutOwner(pickAutopilotHumanApproachLine(peerName));

      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      if (bestDist <= npcTouchDistPx(width) * 1.5) {
        triggerJumpBurst();
      }

      await new Promise(r => setTimeout(r, 1_500));
    } finally {
      humanAttractUntilRef.current = 0;
      endAutopilotEvent('human-approach');
      resolveAttract();
    }
  }, [mpRef, npcWorldXRefs, resolveAttract, shoutOwner, triggerJumpBurst]);

  const runRpsGame = useCallback(async (
    ownerId: string,
    festieIdx: number,
    targetIdx: number,
  ) => {
    if (!tryBeginAutopilotEvent('rps')) return;
    setPaused(true);

    const target = effectiveNpcCast[targetIdx];
    if (!target) {
      endAutopilotEvent('rps');
      setPaused(false);
      return;
    }

    try {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      snapNpcPairForConvo(ownerId, target.id, width, {
        npcCast: effectiveNpcCast,
        npcWorldXRefs,
      });
      setRpsPairIds([ownerId, target.id]);

      await new Promise(r => setTimeout(r, AUTOPILOT_RPS_TIMING.afterSnapMs));
      if (!enabled) return;

      shoutOwner(pickRpsGameIntroLine());
      await new Promise(r => setTimeout(r, AUTOPILOT_RPS_TIMING.afterIntroMs));

      let ownerWins = 0;
      let targetWins = 0;

      for (let round = 0; round < AUTOPILOT_RPS_ROUNDS; round++) {
        if (!enabled) break;

        const ownerChoice = pickRpsChoice();
        const targetChoice = pickRpsChoice();
        const ownerReveal = rpsEmoji(ownerChoice);
        const targetReveal = rpsEmoji(targetChoice);

        shoutOwner(formatRpsShootReveal(ownerReveal));
        await new Promise(r => setTimeout(r, AUTOPILOT_RPS_TIMING.betweenRevealMs));
        roomChatterRef.current?.handleNpcShout(target.id, formatRpsOpponentReveal(targetReveal));

        await new Promise(r => setTimeout(r, AUTOPILOT_RPS_TIMING.afterRevealMs));

        const result = resolveRps(ownerChoice, targetChoice);

        if (result === 'a') {
          ownerWins++;
          triggerJumpBurst();
          shoutOwner(pickRpsCelebrationLine());
        } else if (result === 'b') {
          targetWins++;
          roomChatterRef.current?.handleNpcShout(target.id, pickRpsCelebrationLine());
        } else {
          shoutOwner(pickRpsTieLine());
          roomChatterRef.current?.handleNpcShout(target.id, pickRpsTieLine());
        }

        await new Promise(r => setTimeout(r, AUTOPILOT_RPS_TIMING.afterResultMs));
      }

      if (enabled) {
        if (ownerWins > targetWins) {
          shoutOwner(pickRpsSeriesWinLine(ownerWins, targetWins));
          triggerJumpBurst();
        } else if (targetWins > ownerWins) {
          roomChatterRef.current?.handleNpcShout(target.id, pickRpsSeriesWinLine(targetWins, ownerWins));
          shoutOwner(pickRpsLossLine());
        } else {
          shoutOwner('series tied');
        }
      }

      await new Promise(r => setTimeout(r, AUTOPILOT_RPS_TIMING.seriesEndMs));
    } finally {
      setRpsPairIds(null);
      releaseNpcConvoSnap();
      endAutopilotEvent('rps');
      setPaused(false);
      resolveAttract();
    }
  }, [
    effectiveNpcCast,
    enabled,
    npcWorldXRefs,
    resolveAttract,
    roomChatterRef,
    shoutOwner,
    triggerJumpBurst,
  ]);

  const tickAutopilotBehaviors = useCallback(() => {
    const ownerId = ownerFestieNpcId;
    if (!enabled || !ownerId) return;

    const now = Date.now();
    const festieIdx = ownerFestieIndex;
    if (festieIdx < 0) return;

    const chatDrawings = chatNpcDrawingsRef.current ?? [];
    const ambientCtx = buildAutopilotAmbientContext({
      stageName,
      creatorStage,
      stagePlaybackChannel,
      cinemaNowPlaying,
      concertNowPlaying,
      remotePlayers: mpRef.current?.remoteStateRef.current
        ? [...mpRef.current.remoteStateRef.current.values()]
        : [],
    });

    const nowPlaying = ambientCtx.nowPlaying;
    const prevNowPlaying = lastNowPlayingRef.current;

    if (isAutopilotEventBusy()) return;
    if (roomChatterRef.current?.isNpcInConvo(ownerId)) return;

    const occupied = isOwnerFestieOccupied(ownerId, activeEaselSession, chatDrawings);
    if (occupied) return;

    // Nap mode
    if (napUntilRef.current > now) {
      setPaused(true);
      return;
    }
    if (sessionStartedAtRef.current > 0 && now - sessionStartedAtRef.current > AUTOPILOT_NAP_AFTER_MS) {
      if (Math.random() < 0.08) {
        napUntilRef.current = nextAutopilotNapUntil(sessionStartedAtRef.current, now);
        shoutOwner(pickAutopilotNapLine());
        setPaused(true);
        return;
      }
    }
    setPaused(false);

    // Long-running events first — one action per tick.
    if (now >= rpsAtRef.current) {
      rpsAtRef.current = nextAutopilotAtMs(AUTOPILOT_RPS_WINDOW_MS, now);
      if (Math.random() < AUTOPILOT_RPS_TRIGGER_PROBABILITY) {
        const candidates = effectiveNpcCast
          .map((c, i) => ({ c, i }))
          .filter(({ c, i }) => i !== festieIdx && c.id !== ownerId && !isBuzNpc(c.id));
        if (candidates.length > 0) {
          const { i: targetIdx } = candidates[Math.floor(Math.random() * candidates.length)]!;
          void runRpsGame(ownerId, festieIdx, targetIdx);
          return;
        }
      }
    }

    if (now >= npcChatAtRef.current) {
      npcChatAtRef.current = nextAutopilotAtMs(AUTOPILOT_NPC_CHAT_WINDOW_MS, now);
      const candidates = effectiveNpcCast
        .map((c, i) => ({ c, i }))
        .filter(({ c, i }) => i !== festieIdx && c.id !== ownerId && !isBuzNpc(c.id));
      if (candidates.length > 0) {
        const { i: targetIdx } = candidates[Math.floor(Math.random() * candidates.length)]!;
        void runNpcChatSpree(ownerId, festieIdx, targetIdx);
        return;
      }
    }

    if (now >= humanAtRef.current && (mpRef.current?.remoteIds.length ?? 0) > 0) {
      humanAtRef.current = nextAutopilotAtMs(AUTOPILOT_HUMAN_APPROACH_WINDOW_MS, now);
      void runHumanApproach(ownerId, festieIdx);
      return;
    }

    if (easelDrawingEnabled && now >= easelAtRef.current) {
      easelAtRef.current = nextAutopilotAtMs(AUTOPILOT_EASEL_WINDOW_MS, now);
      const alreadyPainting = activeEaselSession?.slots.some(
        s => s.npc === ownerId && s.status === 'painting',
      );
      if (!alreadyPainting && tryBeginAutopilotEvent('easel')) {
        void claimAutopilotEasel(easelStageSlug).then(slot => {
          if (!slot) {
            endAutopilotEvent('easel');
            return;
          }
          notifyEaselUpdated();
          const topic = slot.topic?.trim() || 'something';
          shoutOwner(pickAutopilotEaselLine(topic));
          const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
          const wx = easelSlotWorldX(slot.slot, easelStageSlug, width, easelLayoutRoute, gndScrollWorldOff);
          easelAttractUntilRef.current = Date.now() + 15_000;
          setAttractWx(wx);
          endAutopilotEvent('easel');
        });
        return;
      }
    }

    if (now >= partyPropAtRef.current) {
      partyPropAtRef.current = nextAutopilotAtMs(AUTOPILOT_PARTY_PROP_WINDOW_MS, now);
      const prop = pickAutopilotPartyProp(playerLoadout, playerCoins);
      if (prop) {
        shoutOwner(pickAutopilotPartyPropLine(prop.name));
        void handleVendorPurchase(prop.itemId).then(ok => {
          if (ok && prop.needsPurchase) recordFlexPurchase(prop.name);
        });
        return;
      }
    }

    if (
      curatedStageChannel
      && sendLineupVote
      && now >= lineupVoteAtRef.current
    ) {
      lineupVoteAtRef.current = nextAutopilotAtMs(AUTOPILOT_LINEUP_VOTE_WINDOW_MS, now);
      const pick = pickAutopilotLineupVote(curatedStageChannel, lineupMyVote);
      if (pick && !lineupMyVote) {
        sendLineupVote(curatedStageChannel, pick.videoId);
        shoutOwner(pickAutopilotLineupVoteLine(pick.title));
        flexShout('vote', pick.title.toLowerCase());
        return;
      }
    }

    if (nowPlaying && nowPlaying !== prevNowPlaying) {
      if (prevNowPlaying != null) {
        triggerJumpBurst();
        shoutOwner(pickAutopilotDropReactionLine(nowPlaying));
        const cfg = effectiveNpcCast[festieIdx];
        if (cfg?.stageAnchor) {
          const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
          const stageWx = crowdSpawnWorldX(
            cfg.stageAnchor as StageAnchorKind,
            gndScrollWorldOff,
            ownerId,
            width,
          );
          if (stageWx != null) {
            stageAttractUntilRef.current = now + 8_000;
            setAttractWx(stageWx);
          }
        }
        lastNowPlayingRef.current = nowPlaying;
        return;
      }
      lastNowPlayingRef.current = nowPlaying;
    }

    if (
      ownerFestie?.personality_notes?.trim()
      && now >= describeAtRef.current
    ) {
      describeAtRef.current = nextAutopilotAtMs(AUTOPILOT_DESCRIBE_SHOUTOUT_WINDOW_MS, now);
      void fetchAutopilotDescribeShoutout(easelStageSlug).then(text => {
        if (text && !isAutopilotEventBusy() && !isOwnerFestieOccupied(ownerId, activeEaselSession, chatNpcDrawingsRef.current ?? [])) {
          shoutOwner(text);
        }
      });
      return;
    }

    if (now >= rivalryAtRef.current) {
      rivalryAtRef.current = nextAutopilotAtMs(AUTOPILOT_RIVALRY_WINDOW_MS, now);
      const rivals = effectiveNpcCast.filter(c => isFestieNpcId(c.id) && c.id !== ownerId);
      if (rivals.length > 0) {
        const rival = rivals[Math.floor(Math.random() * rivals.length)]!;
        shoutOwner(pickAutopilotRivalryLine(rival.name));
        if (Math.random() < 0.35) {
          roomChatterRef.current?.handleNpcShout(rival.id, pickAutopilotRivalryLine(playerName ?? 'my human\'s festie'));
        }
        return;
      }
    }

    if (now >= jumpBurstAtRef.current) {
      jumpBurstAtRef.current = nextAutopilotAtMs(AUTOPILOT_JUMP_BURST_WINDOW_MS, now);
      triggerJumpBurst();
      return;
    }

    resolveAttract();
  }, [
    activeEaselSession?.slots,
    chatNpcDrawingsRef,
    cinemaNowPlaying,
    concertNowPlaying,
    creatorStage,
    curatedStageChannel,
    easelDrawingEnabled,
    easelLayoutRoute,
    easelStageSlug,
    effectiveNpcCast,
    enabled,
    flexShout,
    gndScrollWorldOff,
    handleVendorPurchase,
    lineupMyVote,
    mpRef,
    ownerFestie,
    ownerFestieIndex,
    ownerFestieNpcId,
    playerCoins,
    playerLoadout,
    playerName,
    recordFlexPurchase,
    resolveAttract,
    roomChatterRef,
    runHumanApproach,
    runNpcChatSpree,
    runRpsGame,
    sendLineupVote,
    shoutOwner,
    stageName,
    stagePlaybackChannel,
    triggerJumpBurst,
  ]);

  const ownerFestieAttractWx = attractWx ?? vendorAttractWx;

  return {
    ownerFestieAttractWx,
    ownerFestiePaused: paused,
    jumpBurstKey,
    rpsPairIds,
    tickAutopilotBehaviors,
    recordFlexPurchase,
    recordFlexLoss,
    recordFlexDraw,
  };
}
