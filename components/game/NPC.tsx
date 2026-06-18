'use client';
import { useState, useEffect, useRef, useLayoutEffect, useMemo, memo } from 'react';
import Character, { type CharacterHandle } from './Character';
import { NpcChatOverlay } from './ConnectChatOverlay';
import type { CharacterAccessory } from './characterAccessories';
import type { CharacterLoadout } from './characters/loadout';
import { CHAR_BOTTOM, crowdDepthOffsetPx, crowdDepthZIndex } from './groundLayout';
import { AttachedChatEmojiIndicator, screenXToBubbleSide } from './ChatBubble';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import {
  crowdSpawnWorldX,
  STAGE_VENDOR_WANDER_PX,
  vendorAnchorGroundWorldX,
  type StageAnchorKind,
} from '@/lib/stageAnchor';
import { getNpcConvoHold } from '@/lib/npcConvoHold';
import type { VenueRoute } from '@/lib/venueSlugs';
import { easelNpcStandWorldX, easelNpcStandWorldXForCanvas } from '@/lib/easel/layout';
import { setEaselPainterReady } from '@/lib/easel/painterReadyRegistry';
import { easelPaintingChatter } from '@/lib/easel/paintingLabel';
import {
  pickWorldXOutsideEaselBlock,
  shouldNpcAvoidEaselCanvas,
  worldXBlocksEaselCanvas,
} from '@/lib/easel/canvasBlocking';
import { isFestieNpcId } from '@/lib/festie/toCharacterDef';
import { setNpcMovementTick, getNpcSyncedWorldX, isNpcNetworkFollowMode } from '@/lib/npcMovementRegistry';
import { setNpcDancingToggle } from '@/lib/npcDancingRegistry';
import { Z_CHAT_CHARACTER } from '@/lib/zLayers';
import {
  NPC_FAR_WANDER_CHANCE,
  NPC_IDLE_MS_SCALE,
  NPC_JUMP_CHANCE_SCALE,
  NPC_JUMP_CHECK_MS,
  NPC_WANDER_DISTANCE_SCALE,
  NPC_WANDER_LEG_MS_SCALE,
  NPC_WANDER_START_CHANCE,
} from '@/lib/npcMovementTuning';
import type { ChatLine } from '@/lib/chatLines';
import { createChatLine } from '@/lib/chatLines';
import { chatConnectSpreadPx } from '@/lib/chatConnectSpread';
// ── Personality ────────────────────────────────────────────────────────────────
export type Personality = {
  /** Walk speed as % of viewport width per frame. */
  speed: number;
  idleMs: [number, number];
  /** Preferred on-screen x range (%). Converted to world coords at pick time. */
  wanderRange: [number, number];
  jumpiness: number;
};

export type NPCConfig = {
  startX: number;
  entryDirection: 'left' | 'right';
  entryDelay: number;
  balloonColor: string;
  scale?: number;
  accessory?: CharacterAccessory;
  loadout?: CharacterLoadout;
  outfit?: string;
  personality: Personality;
  name: string;
};

type State = 'idle' | 'wandering';

type NPCProps = NPCConfig & {
  /** Stable id — used for crowd depth offset. */
  characterId: string;
  /** Index in CHARACTERS — used by the shared movement RAF in SFCity. */
  index: number;
  stageAnchor?: StageAnchorKind;
  stageCrowd?: StageAnchorKind;
  /** World-x that attracts idle wander targets — e.g. the cinema easel. */
  wanderAttractWorldX?: number;
  /** Easel slot while painting — stand position derived each frame from viewport width. */
  easelPaintingSlot?: number;
  easelStageSlug?: string;
  /** Venue template for stand position when `easelStageSlug` is a creator stage id. */
  easelLayoutRoute?: VenueRoute;
  /** Fired when NPC pins at the easel stand (starts drawing clock). */
  onEaselStationed?: (npcId: string) => void;
  /** Drawing subject — shown in chat bubble while status is painting. */
  easelPaintingLabel?: string | null;
  /** Chat-triggered drawing subject — canvas appears next to NPC. */
  chatPromptDrawingLabel?: string | null;
  /** Canvas center world-x — NPC stands to its left while drawing. */
  chatPromptCanvasWorldX?: number | null;
  paused: boolean;
  greeting: boolean;
  /** Soft connect glow — autopilot owner festie only. */
  connectGlow?: boolean;
  /** In a connected conversation — pauses wander; no connect aura. */
  chatConnected?: boolean;
  /** Active NPC↔NPC pair convo — shows 💬 indicator only while server convo is live. */
  pairChatIndicator?: boolean;
  /** Offline festie dim tier — reduced opacity and glow. */
  dimmed?: boolean;
  greetFacing: 'left' | 'right';
  greetingChat?: {
    name: string;
    npcTyping: boolean;
    messages: ChatLine[];
  };
  /** Solo public shouts (ambient cheers, etc.). */
  publicMessages?: ChatLine[];
  /** Deep Space — zero-G float visuals instead of walk cycle. */
  spaceFloat?: boolean;
  /** Spawn immediately at world-x instead of walking in from off-screen. */
  spawnWorldX?: number;
  /** Owner festie hidden while the human player avatar is on stage. */
  ownerAvatarSuppressed?: boolean;
};

function rndBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function vw() {
  return typeof window !== 'undefined' ? window.innerWidth : 1200;
}

/** Convert screen % (player at 50%) to world-x. */
export function screenPctToWorldX(pct: number, worldOff: number, width = vw()) {
  return worldOff + ((pct - 50) / 100) * width;
}

/** Convert world-x to screen %. */
export function worldXToScreenPct(worldX: number, worldOff: number, width = vw()) {
  return 50 + ((worldX - worldOff) / width) * 100;
}

const SCREEN_MIN = -30;
const SCREEN_MAX = 130;
/** Pause wander AI when off-screen — same threshold on desktop and mobile. */
const NPC_OFFSCREEN_LEFT = -22;
const NPC_OFFSCREEN_RIGHT = 122;

const ON_SCREEN_SPAWN_MIN = 15;
const ON_SCREEN_SPAWN_MAX = 85;

function NPC({
  characterId,
  index,
  name,
  startX, entryDirection, entryDelay,
  balloonColor, scale = 0.34, accessory, loadout, outfit,
  personality, stageAnchor, stageCrowd, wanderAttractWorldX,
  easelPaintingSlot, easelStageSlug, easelLayoutRoute,
  onEaselStationed,
  easelPaintingLabel,
  chatPromptDrawingLabel,
  chatPromptCanvasWorldX,
  paused, greeting, connectGlow = false, chatConnected = false, pairChatIndicator = false, dimmed = false, greetFacing,   greetingChat,
  publicMessages,
  spaceFloat = false,
  spawnWorldX,
  ownerAvatarSuppressed = false,
}: NPCProps) {
  const depthY = useMemo(() => crowdDepthOffsetPx(characterId), [characterId]);
  const depthZ = crowdDepthZIndex(depthY);

  // ── React state: only for infrequent visual changes ─────────────────────────
  const [jumping,   setJumping]  = useState(false);
  const [active,    setActive]   = useState(false);
  const [easelStationed, setEaselStationed] = useState(false);
  // screenX state only needed for bubbleSide — updated when greeting starts.
  const [screenX,   setScreenX]  = useState(startX);

  // ── Imperative animation state — updated directly to DOM, zero React cost ───
  const characterRef  = useRef<CharacterHandle>(null);
  const greetingRef   = useRef(greeting);
  greetingRef.current = greeting;
  const facingRef     = useRef<'left' | 'right'>(entryDirection);
  const walkingRef    = useRef(false);
  const onScreenRef   = useRef(true);

  // ── World / movement refs ──────────────────────────────────────────────────
  const divRef              = useRef<HTMLDivElement>(null);
  const screenXRef          = useRef(startX);
  const worldXRef           = useRef(0);
  const targetWorldRef      = useRef(0);
  const stateRef            = useRef<State>('idle');
  const pausedRef           = useRef(paused);
  const easelStationedRef   = useRef(false);
  const easelPaintingSlotRef = useRef<number | undefined>(easelPaintingSlot);
  const easelStageSlugRef    = useRef<string | undefined>(easelStageSlug);
  const easelLayoutRouteRef  = useRef<VenueRoute | undefined>(easelLayoutRoute);
  const chatPromptCanvasWorldXRef = useRef<number | null | undefined>(chatPromptCanvasWorldX);
  easelPaintingSlotRef.current = easelPaintingSlot;
  easelStageSlugRef.current = easelStageSlug;
  easelLayoutRouteRef.current = easelLayoutRoute;
  chatPromptCanvasWorldXRef.current = chatPromptCanvasWorldX;

  const resolveEaselStandWorldX = (width: number, cameraOff: number): number | undefined => {
    const slot = easelPaintingSlotRef.current;
    const slug = easelStageSlugRef.current;
    if (slot == null || !slug) return undefined;
    return easelNpcStandWorldX(slot, slug, width, easelLayoutRouteRef.current, cameraOff);
  };

  const resolvePromptStandWorldX = (): number | undefined => {
    const canvasX = chatPromptCanvasWorldXRef.current;
    if (canvasX == null) return undefined;
    return easelNpcStandWorldXForCanvas(canvasX);
  };
  const jumpingRef          = useRef(false);
  const avoidPlayerUntil    = useRef(0);
  const jumpTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageSpotRef        = useRef(0);
  const stageVisibleRef     = useRef(!stageAnchor);
  const chatConnectedRef    = useRef(chatConnected || greeting);
  chatConnectedRef.current = chatConnected || greeting;
  const ownerAvatarSuppressedRef = useRef(ownerAvatarSuppressed);
  ownerAvatarSuppressedRef.current = ownerAvatarSuppressed;
  const spaceFloatRef       = useRef(spaceFloat);
  spaceFloatRef.current     = spaceFloat;
  const wasPausedRef        = useRef(paused);

  // Keep RAF/decision loops in sync — useEffect runs after paint.
  pausedRef.current = paused;

  // Sync screenX state when greeting starts (needed for bubble side only).
  useEffect(() => {
    if (greeting) setScreenX(screenXRef.current);
  }, [greeting]);

  // ── Re-sync Character DOM after any React render of NPC ────────────────────
  // Runs before paint on every NPC render (jump, active, screenX, etc.).
  // Ensures facing/walking DOM state survives React reconciliation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    characterRef.current?.setFacing(greeting ? greetFacing : facingRef.current);
    characterRef.current?.setWalking(!greeting && !paused && walkingRef.current);
    // Position is driven by the RAF loop — omit `left` from React style or
    // re-renders (dancing, ambient chat, jump) snap back to entry `startX`
    // off-screen while collision still tracks the real world-x.
    if (divRef.current) {
      divRef.current.style.left = `${screenXRef.current}%`;
    }
  });

  useLayoutEffect(() => {
    setNpcDancingToggle(index, (d) => {
      characterRef.current?.setDancing(d && !greetingRef.current);
    });
    return () => setNpcDancingToggle(index, null);
  }, [index]);

  useLayoutEffect(() => {
    if (greeting) characterRef.current?.setDancing(false);
  }, [greeting]);

  // ── Imperative helpers — update ref + Character DOM together ────────────────
  const applyFacing = (f: 'left' | 'right') => {
    if (f === facingRef.current) return;
    facingRef.current = f;
    characterRef.current?.setFacing(f);
  };
  const applyWalking = (w: boolean) => {
    if (w === walkingRef.current) return;
    walkingRef.current = w;
    characterRef.current?.setWalking(w);
  };

  const stationAtEasel = (worldX: number) => {
    easelStationedRef.current = true;
    setEaselStationed(true);
    setEaselPainterReady(characterId, true);
    onEaselStationed?.(characterId);
    worldXRef.current = worldX;
    targetWorldRef.current = worldX;
    const pct = worldXToScreenPct(worldX, gameWorldOffRef.current, vw());
    screenXRef.current = pct;
    onScreenRef.current = true;
    if (divRef.current) {
      divRef.current.style.left = `${pct}%`;
      divRef.current.style.visibility = 'visible';
      divRef.current.style.transform = 'translate(0px, 0px)';
    }
    stateRef.current = 'idle';
    applyFacing('right');
    applyWalking(false);
  };

  useEffect(() => {
    if (paused && !wasPausedRef.current) {
      stateRef.current = 'idle';
      applyWalking(false);
      if (jumpingRef.current) {
        jumpingRef.current = false;
        setJumping(false);
        if (jumpTimerRef.current) {
          clearTimeout(jumpTimerRef.current);
          jumpTimerRef.current = null;
        }
      }
    }
    wasPausedRef.current = paused;
  }, [paused]);

  const anchorWorldX = () =>
    stageAnchor
      ? vendorAnchorGroundWorldX(stageAnchor, gameWorldOffRef.current, vw())
      : null;

  const pickAnchorTarget = (anchor: number) =>
    anchor + rndBetween(-STAGE_VENDOR_WANDER_PX, STAGE_VENDOR_WANDER_PX);

  const pctToWorld = (pct: number) =>
    screenPctToWorldX(pct, gameWorldOffRef.current);

  const pickWanderTarget = (curWorldX: number) => {
    const anchor = anchorWorldX();
    if (stageAnchor && anchor != null) return pickAnchorTarget(anchor);

    // Attract toward a fixed world point (e.g. cinema easel) ~32% of the time.
    if (wanderAttractWorldX != null && Number.isFinite(wanderAttractWorldX) && Math.random() < 0.32) {
      const attracted = wanderAttractWorldX + rndBetween(-48, 48);
      if (!shouldNpcAvoidEaselCanvas(characterId) || !worldXBlocksEaselCanvas(attracted)) {
        return attracted;
      }
    }

    const [prefLo, prefHi] = personality.wanderRange;
    const curPct = worldXToScreenPct(curWorldX, gameWorldOffRef.current);
    const avoiding = Date.now() < avoidPlayerUntil.current;

    let targetWorldX: number;
    if (avoiding) {
      const targetPct = curPct <= 50
        ? rndBetween(SCREEN_MIN, 12)
        : rndBetween(88, SCREEN_MAX);
      targetWorldX = pctToWorld(
        curPct + (targetPct - curPct) * NPC_WANDER_DISTANCE_SCALE,
      );
    } else if (Math.random() < NPC_FAR_WANDER_CHANCE) {
      const targetPct = curPct < 50
        ? rndBetween(SCREEN_MIN, prefLo)
        : rndBetween(prefHi, SCREEN_MAX);
      targetWorldX = pctToWorld(
        curPct + (targetPct - curPct) * NPC_WANDER_DISTANCE_SCALE,
      );
    } else {
      const targetPct = rndBetween(
        Math.max(SCREEN_MIN, prefLo),
        Math.min(SCREEN_MAX, prefHi),
      );
      targetWorldX = pctToWorld(
        curPct + (targetPct - curPct) * NPC_WANDER_DISTANCE_SCALE,
      );
    }

    if (shouldNpcAvoidEaselCanvas(characterId) && worldXBlocksEaselCanvas(targetWorldX)) {
      return pickWorldXOutsideEaselBlock(curWorldX);
    }
    return targetWorldX;
  };

  const fleeFromPlayer = () => {
    const anchor = anchorWorldX();
    if (stageAnchor && anchor != null) {
      targetWorldRef.current = pickAnchorTarget(anchor);
      stateRef.current = 'wandering';
      applyFacing(targetWorldRef.current > worldXRef.current ? 'right' : 'left');
      applyWalking(true);
      return;
    }

    avoidPlayerUntil.current = Date.now() + rndBetween(25_000, 45_000);
    const curPct = worldXToScreenPct(worldXRef.current, gameWorldOffRef.current);
    const fleeTarget = curPct <= 50
      ? pctToWorld(rndBetween(SCREEN_MIN, 5))
      : pctToWorld(rndBetween(95, SCREEN_MAX));
    targetWorldRef.current = fleeTarget;
    stateRef.current = 'wandering';
    applyFacing(fleeTarget > worldXRef.current ? 'right' : 'left');
    applyWalking(true);
  };

  const spawnInPlace = (worldX: number) => {
    worldXRef.current = worldX;
    targetWorldRef.current = worldX;
    const pct = worldXToScreenPct(worldX, gameWorldOffRef.current, vw());
    screenXRef.current = pct;
    onScreenRef.current = true;
    if (divRef.current) {
      divRef.current.style.left = `${pct}%`;
      divRef.current.style.visibility = 'visible';
    }
    facingRef.current = Math.random() < 0.5 ? 'left' : 'right';
    walkingRef.current = false;
    stateRef.current = 'idle';
    setActive(true);
  };

  // ── Entry ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stageAnchor) {
      setActive(true);
      return;
    }

    const held = getNpcConvoHold(characterId);
    if (held != null && Number.isFinite(held)) {
      spawnInPlace(held);
      if (ownerAvatarSuppressedRef.current && divRef.current) {
        divRef.current.style.visibility = 'hidden';
      }
      return;
    }

    const t = setTimeout(() => {
      if (spawnWorldX != null && Number.isFinite(spawnWorldX)) {
        spawnInPlace(spawnWorldX);
        return;
      }

      if (stageCrowd) {
        const worldX = crowdSpawnWorldX(stageCrowd, gameWorldOffRef.current, characterId, vw());
        spawnInPlace(worldX ?? pctToWorld(startX));
        return;
      }

      if (startX >= ON_SCREEN_SPAWN_MIN && startX <= ON_SCREEN_SPAWN_MAX) {
        spawnInPlace(pctToWorld(startX));
        return;
      }

      worldXRef.current = pctToWorld(startX);
      const entryTargetPct = rndBetween(25, 75);
      targetWorldRef.current = pctToWorld(entryTargetPct);
      facingRef.current = entryTargetPct > startX ? 'right' : 'left';
      walkingRef.current = true;
      stateRef.current = 'wandering';
      setActive(true);
    }, entryDelay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryDelay, startX, stageAnchor, stageCrowd, characterId, spawnWorldX]);

  useLayoutEffect(() => {
    if (!active || !divRef.current) return;
    if (ownerAvatarSuppressed) {
      divRef.current.style.visibility = 'hidden';
      applyWalking(false);
    } else if (onScreenRef.current) {
      divRef.current.style.visibility = 'visible';
    }
  }, [active, ownerAvatarSuppressed]);

  useEffect(() => {
    if (!active || easelPaintingSlot == null || !easelStageSlug) return;
    const standX = easelNpcStandWorldX(
      easelPaintingSlot,
      easelStageSlug,
      vw(),
      easelLayoutRoute,
      gameWorldOffRef.current,
    );
    stationAtEasel(standX);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, easelPaintingSlot, easelStageSlug, easelLayoutRoute]);

  useEffect(() => {
    if (!active || chatPromptCanvasWorldX == null) return;
    stationAtEasel(easelNpcStandWorldXForCanvas(chatPromptCanvasWorldX));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, chatPromptCanvasWorldX]);

  useEffect(() => {
    if (easelPaintingSlot != null || chatPromptCanvasWorldX != null || !easelStationedRef.current) return;
    easelStationedRef.current = false;
    setEaselStationed(false);
    setEaselPainterReady(characterId, false);
    stateRef.current = 'idle';
    applyWalking(false);
  }, [easelPaintingSlot, chatPromptCanvasWorldX, characterId]);

  useEffect(() => () => setEaselPainterReady(characterId, false), [characterId]);

  const offlineFestieNpc = isFestieNpcId(characterId);

  // ── Decision loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || ((easelPaintingSlot != null || chatPromptCanvasWorldX != null) && easelStationedRef.current)) return;
    let timer: ReturnType<typeof setTimeout>;

    const decide = () => {
      if (isNpcNetworkFollowMode()) {
        timer = setTimeout(decide, 500);
        return;
      }

      if (ownerAvatarSuppressedRef.current) {
        if (divRef.current) divRef.current.style.visibility = 'hidden';
        applyWalking(false);
        timer = setTimeout(decide, 500);
        return;
      }

      if (!offlineFestieNpc && !onScreenRef.current) {
        timer = setTimeout(decide, 800);
        return;
      }

      if (pausedRef.current) {
        timer = setTimeout(decide, 500);
        return;
      }

      if (stateRef.current === 'idle') {
        if (Math.random() > NPC_WANDER_START_CHANCE) {
          timer = setTimeout(
            decide,
            rndBetween(
              personality.idleMs[0] * NPC_IDLE_MS_SCALE * 0.5,
              personality.idleMs[1] * NPC_IDLE_MS_SCALE * 0.5,
            ),
          );
          return;
        }
        stateRef.current = 'wandering';
        targetWorldRef.current = pickWanderTarget(worldXRef.current);
        applyFacing(targetWorldRef.current > worldXRef.current ? 'right' : 'left');
        applyWalking(true);
        timer = setTimeout(
          decide,
          rndBetween(4000, 10_000) * NPC_WANDER_LEG_MS_SCALE,
        );
        return;
      }

      stateRef.current = 'idle';
      applyWalking(false);
      timer = setTimeout(
        decide,
        rndBetween(
          personality.idleMs[0] * NPC_IDLE_MS_SCALE,
          personality.idleMs[1] * NPC_IDLE_MS_SCALE,
        ),
      );
    };

    timer = setTimeout(decide, rndBetween(800, 2000));

    const jumpInterval = setInterval(() => {
      if (!onScreenRef.current) return;
      if (!pausedRef.current && Math.random() < personality.jumpiness * NPC_JUMP_CHANCE_SCALE && !jumpingRef.current) {
        jumpingRef.current = true;
        setJumping(true);
        if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
        jumpTimerRef.current = setTimeout(() => {
          jumpTimerRef.current = null;
          jumpingRef.current   = false;
          setJumping(false);
        }, 560);
      }
    }, rndBetween(...NPC_JUMP_CHECK_MS));

    return () => {
      clearTimeout(timer);
      clearInterval(jumpInterval);
      if (jumpTimerRef.current) { clearTimeout(jumpTimerRef.current); jumpTimerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, personality, spaceFloat, easelPaintingSlot, chatPromptCanvasWorldX]);

  // ── Movement — registered with SFCity's single game-frame RAF ───────────────
  useEffect(() => {
    if (!active) {
      setNpcMovementTick(index, null);
      return;
    }

    setNpcMovementTick(index, (off, width) => {
      const convoHold = getNpcConvoHold(characterId);
      const heldForConvo = convoHold !== undefined;
      if (heldForConvo) {
        worldXRef.current = convoHold;
        targetWorldRef.current = convoHold;
        stateRef.current = 'idle';
        applyWalking(false);
      } else if (pausedRef.current) {
        if (walkingRef.current) applyWalking(false);
        stateRef.current = 'idle';
      }

      const standX = easelPaintingSlotRef.current != null
        ? resolveEaselStandWorldX(width, off)
        : resolvePromptStandWorldX();
      if (standX != null && !heldForConvo) {
        worldXRef.current = standX;
        targetWorldRef.current = standX;
        stateRef.current = 'idle';
        if (!pausedRef.current) {
          applyFacing('right');
        }
        applyWalking(false);
      } else if (stageAnchor && !heldForConvo) {
        const anchor = vendorAnchorGroundWorldX(stageAnchor, off, width);
        const visible = anchor != null;
        stageVisibleRef.current = visible;
        if (divRef.current) {
          divRef.current.style.visibility = visible ? 'visible' : 'hidden';
        }
        if (!visible) return Number.NaN;

        if (stageSpotRef.current === 0) {
          stageSpotRef.current = rndBetween(-STAGE_VENDOR_WANDER_PX * 0.5, STAGE_VENDOR_WANDER_PX * 0.5);
          worldXRef.current = anchor + stageSpotRef.current;
        }
        if (!pausedRef.current) {
          const home = anchor + stageSpotRef.current;
          const drift = home - worldXRef.current;
          if (stateRef.current === 'idle' && Math.abs(drift) > 2) {
            const step = Math.min((personality.speed / 100) * width, Math.abs(drift));
            worldXRef.current += drift > 0 ? step : -step;
          }
        }
      }

      const atEasel = standX != null;

      const syncedWorldX = isNpcNetworkFollowMode() ? getNpcSyncedWorldX(index) : undefined;
      if (
        syncedWorldX != null
        && Number.isFinite(syncedWorldX)
        && !heldForConvo
        && !pausedRef.current
        && !atEasel
      ) {
        const cur = worldXRef.current;
        const diff = syncedWorldX - cur;
        const step = Math.max((personality.speed / 100) * width * 0.9, 2.5);
        if (Math.abs(diff) <= step) {
          worldXRef.current = syncedWorldX;
          applyWalking(false);
          stateRef.current = 'idle';
        } else {
          worldXRef.current += diff > 0 ? step : -step;
          applyFacing(diff > 0 ? 'right' : 'left');
          applyWalking(true);
          stateRef.current = 'wandering';
        }
        targetWorldRef.current = syncedWorldX;
      } else if (!heldForConvo && !pausedRef.current && !atEasel && stateRef.current === 'wandering') {
        const target = targetWorldRef.current;
        const cur    = worldXRef.current;
        const diff   = target - cur;
        const spd    = (personality.speed / 100) * width;

        if (Math.abs(diff) < spd) {
          worldXRef.current = target;
          targetWorldRef.current = target;
          stateRef.current = 'idle';
          applyWalking(false);
        } else {
          worldXRef.current += diff > 0 ? spd : -spd;
          applyFacing(diff > 0 ? 'right' : 'left');
          applyWalking(true);
        }
      }

      const pct = worldXToScreenPct(worldXRef.current, off, width);
      const onScreen = pausedRef.current
        || (pct >= NPC_OFFSCREEN_LEFT && pct <= NPC_OFFSCREEN_RIGHT);

      if (onScreen !== onScreenRef.current) {
        onScreenRef.current = onScreen;
        if (divRef.current) {
          divRef.current.style.visibility = ownerAvatarSuppressedRef.current || !onScreen
            ? 'hidden'
            : 'visible';
          divRef.current.style.pointerEvents = onScreen && !ownerAvatarSuppressedRef.current ? '' : 'none';
        }
        if (!onScreen) applyWalking(false);
      }

      if (!onScreen && !offlineFestieNpc) {
        screenXRef.current = pct;
        if (divRef.current) divRef.current.style.left = `${pct}%`;
        return worldXRef.current;
      }

      if (
        syncedWorldX == null
        && !heldForConvo
        && !pausedRef.current
        && easelPaintingSlotRef.current == null
        && chatPromptCanvasWorldXRef.current == null
        && shouldNpcAvoidEaselCanvas(characterId)
        && stateRef.current === 'idle'
        && worldXBlocksEaselCanvas(worldXRef.current)
      ) {
        targetWorldRef.current = pickWorldXOutsideEaselBlock(worldXRef.current);
        stateRef.current = 'wandering';
        applyFacing(targetWorldRef.current > worldXRef.current ? 'right' : 'left');
        applyWalking(true);
      }

      screenXRef.current = pct;
      if (divRef.current) {
        divRef.current.style.left = `${pct}%`;
        const spread = chatConnectedRef.current ? chatConnectSpreadPx(pct) : 0;
        const y = easelStationedRef.current ? 0 : depthY;
        divRef.current.style.transform = `translate(${spread}px, ${y}px)`;
      }
      return worldXRef.current;
    });

    return () => { setNpcMovementTick(index, null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index, personality, stageAnchor, spaceFloat, depthY]);

  // ── Flee on disconnect ─────────────────────────────────────────────────────
  const wasGreetingRef = useRef(false);
  useEffect(() => {
    const justDisconnected = wasGreetingRef.current && !greeting;
    wasGreetingRef.current = greeting;
    if (justDisconnected && !easelStationedRef.current && chatPromptCanvasWorldXRef.current == null) {
      fleeFromPlayer();
    }
  }, [greeting]);

  const paintingMessages = useMemo((): ChatLine[] => {
    const label = chatPromptDrawingLabel ?? easelPaintingLabel;
    if (!label) return [];
    return [createChatLine(easelPaintingChatter(label))];
  }, [chatPromptDrawingLabel, easelPaintingLabel]);

  const promptDrawing = Boolean(chatPromptDrawingLabel);
  const showPaintingBubble = promptDrawing
    ? Boolean(chatPromptDrawingLabel)
    : easelStationed && Boolean(easelPaintingLabel);
  const showPublicBubble = Boolean(
    publicMessages?.length && !greeting && !showPaintingBubble,
  );
  /** Easel canvas anchors at CHAR_BOTTOM — painters must match, not use crowd depth. */
  const effectiveDepthY = showPaintingBubble || easelStationed || easelPaintingSlot != null || chatPromptCanvasWorldX != null ? 0 : depthY;
  const bubbleSide = showPaintingBubble
    ? 'left'
    : screenXToBubbleSide(screenX);

  const showGreetingChat = Boolean(
    greeting && greetingChat && (greetingChat.npcTyping || greetingChat.messages.length > 0),
  );
  const showChattingBubble = Boolean(
    pairChatIndicator && !showPaintingBubble && !showGreetingChat,
  );

  if (!active) return null;

  return (
    <div
      ref={divRef}
      className="game-character game-character-crowd"
      style={{
        position: 'absolute',
        bottom: CHAR_BOTTOM,
        transform: `translateY(${effectiveDepthY}px)`,
        zIndex: greeting ? Z_CHAT_CHARACTER : showPaintingBubble ? depthZ + 1 : showChattingBubble ? depthZ + 2 : depthZ,
        opacity: dimmed ? 0.6 : 1,
        filter: dimmed ? 'brightness(0.85)' : undefined,
        transition: 'opacity 0.4s ease, filter 0.4s ease',
      }}
    >
      {showChattingBubble && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '100%',
            marginBottom: 8,
            transform: 'translateX(-50%)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        >
          <AttachedChatEmojiIndicator />
        </div>
      )}
      <div style={{ animation: jumping ? 'ch-jump-outer 0.55s linear' : 'none' }}>
        <Character
          ref={characterRef}
          // Initial values only — imperative setFacing/setWalking take over after mount.
          walking={walkingRef.current}
          facing={facingRef.current}
          spaceFloat={spaceFloat}
          balloonColor={balloonColor}
          loadout={loadout}
          accessory={accessory}
          outfit={outfit}
          scale={scale}
          bubbleSide={bubbleSide}
          easelChatAnchor={showPaintingBubble}
          connectGlow={connectGlow}
          chatOverlay={
            showPaintingBubble ? (
              <NpcChatOverlay
                name={name}
                npcTyping={false}
                messages={paintingMessages}
                side={bubbleSide}
                showTail
                tailAlign="edge"
                faded
              />
            ) : showGreetingChat && greetingChat ? (
              <NpcChatOverlay
                name={greetingChat.name}
                npcTyping={greetingChat.npcTyping}
                messages={greetingChat.messages}
                side={bubbleSide}
              />
            ) : showPublicBubble ? (
              <NpcChatOverlay
                name={name}
                npcTyping={false}
                messages={publicMessages!}
                side={bubbleSide}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

function greetingChatEqual(
  a: NPCProps['greetingChat'],
  b: NPCProps['greetingChat'],
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.name === b.name
    && a.npcTyping === b.npcTyping
    && a.messages === b.messages;
}

function areNpcPropsEqual(prev: NPCProps, next: NPCProps): boolean {
  return prev.characterId === next.characterId
    && prev.index === next.index
    && prev.name === next.name
    && prev.startX === next.startX
    && prev.entryDelay === next.entryDelay
    && prev.entryDirection === next.entryDirection
    && prev.balloonColor === next.balloonColor
    && prev.scale === next.scale
    && prev.outfit === next.outfit
    && prev.loadout === next.loadout
    && prev.accessory === next.accessory
    && prev.stageAnchor === next.stageAnchor
    && prev.stageCrowd === next.stageCrowd
    && prev.wanderAttractWorldX === next.wanderAttractWorldX
    && prev.easelPaintingSlot === next.easelPaintingSlot
    && prev.easelStageSlug === next.easelStageSlug
    && prev.easelLayoutRoute === next.easelLayoutRoute
    && prev.onEaselStationed === next.onEaselStationed
    && prev.easelPaintingLabel === next.easelPaintingLabel
    && prev.chatPromptDrawingLabel === next.chatPromptDrawingLabel
    && prev.chatPromptCanvasWorldX === next.chatPromptCanvasWorldX
    && prev.paused === next.paused
    && prev.greeting === next.greeting
    && prev.connectGlow === next.connectGlow
    && prev.chatConnected === next.chatConnected
    && prev.pairChatIndicator === next.pairChatIndicator
    && prev.dimmed === next.dimmed
    && prev.greetFacing === next.greetFacing
    && prev.spaceFloat === next.spaceFloat
    && prev.spawnWorldX === next.spawnWorldX
    && prev.ownerAvatarSuppressed === next.ownerAvatarSuppressed
    && prev.publicMessages === next.publicMessages
    && greetingChatEqual(prev.greetingChat, next.greetingChat);
}

export default memo(NPC, areNpcPropsEqual);
