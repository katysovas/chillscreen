'use client';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Character, { type CharacterHandle } from './Character';
import type { CharacterAccessory } from './characterAccessories';
import type { CharacterLoadout } from './characters/loadout';
import { CHAR_BOTTOM, crowdDepthOffsetPx } from './groundLayout';
import { screenXToBubbleSide } from './ChatBubble';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import {
  crowdSpawnWorldX,
  STAGE_VENDOR_WANDER_PX,
  vendorAnchorGroundWorldX,
  type StageAnchorKind,
} from '@/lib/stageAnchor';
import { getNpcConvoHold } from '@/lib/npcConvoHold';
import { isFestieNpcId } from '@/lib/festie/toCharacterDef';
import { setNpcMovementTick } from '@/lib/npcMovementRegistry';
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
  /** Walk target beside an easel — pins once arrived. */
  easelWalkTargetWorldX?: number;
  /** Testing — teleport to easel as soon as target is known. */
  easelStationOnLoad?: boolean;
  paused: boolean;
  greeting: boolean;
  /** Soft connect glow — local or remote 1:1 conversation. */
  chatConnected?: boolean;
  /** Offline festie dim tier — reduced opacity and glow. */
  dimmed?: boolean;
  greetFacing: 'left' | 'right';
  dancing?: boolean;
  greetingChat?: {
    name: string;
    npcTyping: boolean;
    messages: ChatLine[];
  };
  /** Deep Space — zero-G float visuals instead of walk cycle. */
  spaceFloat?: boolean;
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

export default function NPC({
  characterId,
  index,
  startX, entryDirection, entryDelay,
  balloonColor, scale = 0.34, accessory, loadout, outfit,
  personality, stageAnchor, stageCrowd, wanderAttractWorldX, easelWalkTargetWorldX, easelStationOnLoad,
  paused, greeting, chatConnected = false, dimmed = false, greetFacing, dancing = false, greetingChat,
  spaceFloat = false,
}: NPCProps) {
  // ── React state: only for infrequent visual changes ─────────────────────────
  const [jumping,   setJumping]  = useState(false);
  const [active,    setActive]   = useState(false);
  const [easelStationed, setEaselStationed] = useState(false);
  // screenX state only needed for bubbleSide — updated when greeting starts.
  const [screenX,   setScreenX]  = useState(startX);

  // ── Imperative animation state — updated directly to DOM, zero React cost ───
  const characterRef  = useRef<CharacterHandle>(null);
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
  const jumpingRef          = useRef(false);
  const avoidPlayerUntil    = useRef(0);
  const jumpTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageSpotRef        = useRef(0);
  const stageVisibleRef     = useRef(!stageAnchor);
  const chatConnectedRef    = useRef(chatConnected || greeting);
  chatConnectedRef.current = chatConnected || greeting;
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
    worldXRef.current = worldX;
    targetWorldRef.current = worldX;
    const pct = worldXToScreenPct(worldX, gameWorldOffRef.current, vw());
    screenXRef.current = pct;
    onScreenRef.current = true;
    if (divRef.current) {
      divRef.current.style.left = `${pct}%`;
      divRef.current.style.visibility = 'visible';
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
      return wanderAttractWorldX + rndBetween(-48, 48);
    }

    const [prefLo, prefHi] = personality.wanderRange;
    const curPct = worldXToScreenPct(curWorldX, gameWorldOffRef.current);
    const avoiding = Date.now() < avoidPlayerUntil.current;

    if (avoiding) {
      const targetPct = curPct <= 50
        ? rndBetween(SCREEN_MIN, 12)
        : rndBetween(88, SCREEN_MAX);
      return pctToWorld(
        curPct + (targetPct - curPct) * NPC_WANDER_DISTANCE_SCALE,
      );
    }

    let targetPct: number;
    if (Math.random() < NPC_FAR_WANDER_CHANCE) {
      targetPct = curPct < 50
        ? rndBetween(SCREEN_MIN, prefLo)
        : rndBetween(prefHi, SCREEN_MAX);
    } else {
      targetPct = rndBetween(
        Math.max(SCREEN_MIN, prefLo),
        Math.min(SCREEN_MAX, prefHi),
      );
    }
    return pctToWorld(
      curPct + (targetPct - curPct) * NPC_WANDER_DISTANCE_SCALE,
    );
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

    const t = setTimeout(() => {
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
  }, [entryDelay, startX, stageAnchor, stageCrowd, characterId]);

  useEffect(() => {
    if (!active || !easelStationOnLoad || easelWalkTargetWorldX == null) return;
    stationAtEasel(easelWalkTargetWorldX);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, easelStationOnLoad, easelWalkTargetWorldX]);

  const offlineFestieNpc = isFestieNpcId(characterId);

  // ── Decision loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || (easelWalkTargetWorldX != null && easelStationedRef.current)) return;
    let timer: ReturnType<typeof setTimeout>;

    const decide = () => {
      if (!offlineFestieNpc && !onScreenRef.current) {
        timer = setTimeout(decide, 800);
        return;
      }

      if (pausedRef.current) {
        timer = setTimeout(decide, 500);
        return;
      }

      // Walk to easel on load — then movement tick pins when close enough.
      if (easelWalkTargetWorldX != null && !easelStationedRef.current) {
        targetWorldRef.current = easelWalkTargetWorldX;
        stateRef.current = 'wandering';
        applyFacing(worldXRef.current <= easelWalkTargetWorldX ? 'right' : 'left');
        applyWalking(true);
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
  }, [active, personality, spaceFloat, easelWalkTargetWorldX]);

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

      if (easelWalkTargetWorldX != null && !heldForConvo) {
        const dist = Math.abs(worldXRef.current - easelWalkTargetWorldX);
        if (!easelStationedRef.current && dist <= 36) {
          stationAtEasel(easelWalkTargetWorldX);
        } else if (easelStationedRef.current) {
          worldXRef.current = easelWalkTargetWorldX;
          targetWorldRef.current = easelWalkTargetWorldX;
          stateRef.current = 'idle';
          applyFacing('right');
          applyWalking(false);
        }
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

      const pct = worldXToScreenPct(worldXRef.current, off, width);
      const onScreen = pausedRef.current
        || (pct >= NPC_OFFSCREEN_LEFT && pct <= NPC_OFFSCREEN_RIGHT);

      if (onScreen !== onScreenRef.current) {
        onScreenRef.current = onScreen;
        if (divRef.current) {
          divRef.current.style.visibility = onScreen ? 'visible' : 'hidden';
          divRef.current.style.pointerEvents = onScreen ? '' : 'none';
        }
        if (!onScreen) applyWalking(false);
      }

      if (!onScreen && !offlineFestieNpc) {
        screenXRef.current = pct;
        if (divRef.current) divRef.current.style.left = `${pct}%`;
        return worldXRef.current;
      }

      if (!heldForConvo && !pausedRef.current && stateRef.current === 'wandering') {
        const target = targetWorldRef.current;
        const cur    = worldXRef.current;
        const diff   = target - cur;
        const spd    = (personality.speed / 100) * width;

        if (Math.abs(diff) < spd) {
          worldXRef.current = target;
          stateRef.current = 'idle';
          applyWalking(false);
        } else {
          worldXRef.current += diff > 0 ? spd : -spd;
          applyFacing(diff > 0 ? 'right' : 'left');
          applyWalking(true);
        }
      }

      screenXRef.current = pct;
      if (divRef.current) {
        divRef.current.style.left = `${pct}%`;
        const depthY = crowdDepthOffsetPx(characterId);
        const spread = chatConnectedRef.current ? chatConnectSpreadPx(pct) : 0;
        divRef.current.style.transform = `translate(${spread}px, ${depthY}px)`;
      }
      return worldXRef.current;
    });

    return () => { setNpcMovementTick(index, null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index, personality, stageAnchor, spaceFloat]);

  // ── Flee on disconnect ─────────────────────────────────────────────────────
  const wasGreetingRef = useRef(false);
  useEffect(() => {
    const justDisconnected = wasGreetingRef.current && !greeting;
    wasGreetingRef.current = greeting;
    if (justDisconnected) fleeFromPlayer();
  }, [greeting]);

  if (!active) return null;

  return (
    <div
      ref={divRef}
      className="game-character game-character-crowd"
      style={{
        position: 'absolute',
        bottom: CHAR_BOTTOM,
        transform: `translateY(${crowdDepthOffsetPx(characterId)}px)`,
        zIndex: greeting ? Z_CHAT_CHARACTER : 18,
        opacity: dimmed ? 0.6 : 1,
        filter: dimmed ? 'brightness(0.85)' : undefined,
        transition: 'opacity 0.4s ease, filter 0.4s ease',
      }}
    >
      <div style={{ animation: jumping ? 'ch-jump-outer 0.55s linear' : 'none' }}>
        <Character
          ref={characterRef}
          // Initial values only — imperative setFacing/setWalking take over after mount.
          walking={walkingRef.current}
          facing={facingRef.current}
          dancing={dancing && !greeting}
          spaceFloat={spaceFloat}
          balloonColor={balloonColor}
          loadout={loadout}
          accessory={accessory}
          outfit={outfit}
          scale={scale}
          bubbleSide={screenXToBubbleSide(screenX)}
          chatConnected={chatConnected || greeting || easelStationed}
        />
      </div>
    </div>
  );
}
