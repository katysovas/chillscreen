'use client';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Character, { type CharacterHandle } from './Character';
import { NpcChatOverlay } from './ConnectChatOverlay';
import type { CharacterAccessory } from './characterAccessories';
import { CHAR_BOTTOM } from './groundLayout';
import { screenXToBubbleSide } from './ChatBubble';
import { gameWorldOffRef } from '@/lib/gameWorldRef';

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
  personality: Personality;
  name: string;
};

type State = 'idle' | 'wandering';

type NPCProps = NPCConfig & {
  paused: boolean;
  greeting: boolean;
  greetFacing: 'left' | 'right';
  dancing?: boolean;
  /** Reports world-x each frame (for collision detection). */
  onMove: (worldX: number) => void;
  greetingChat?: {
    name: string;
    npcTyping: boolean;
    npcMessage: string | null;
  };
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

export default function NPC({
  startX, entryDirection, entryDelay,
  balloonColor, scale = 0.34, accessory,
  personality,
  paused, greeting, greetFacing, dancing = false, onMove, greetingChat,
}: NPCProps) {
  // ── React state: only for infrequent visual changes ─────────────────────────
  const [jumping,   setJumping]  = useState(false);
  const [active,    setActive]   = useState(false);
  // screenX state only needed for bubbleSide — updated when greeting starts.
  const [screenX,   setScreenX]  = useState(startX);

  // ── Imperative animation state — updated directly to DOM, zero React cost ───
  const characterRef  = useRef<CharacterHandle>(null);
  const facingRef     = useRef<'left' | 'right'>(entryDirection);
  const walkingRef    = useRef(false);

  // ── World / movement refs ──────────────────────────────────────────────────
  const divRef              = useRef<HTMLDivElement>(null);
  const screenXRef          = useRef(startX);
  const worldXRef           = useRef(0);
  const targetWorldRef      = useRef(0);
  const stateRef            = useRef<State>('idle');
  const pausedRef           = useRef(paused);
  const jumpingRef          = useRef(false);
  const avoidPlayerUntil    = useRef(0);
  const rafRef              = useRef<number | null>(null);
  const jumpTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMoveRef           = useRef(onMove);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

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

  const speedPx = () => (personality.speed / 100) * vw();

  const pctToWorld = (pct: number) =>
    screenPctToWorldX(pct, gameWorldOffRef.current);

  const pickWanderTarget = (curWorldX: number) => {
    const [prefLo, prefHi] = personality.wanderRange;
    const curPct = worldXToScreenPct(curWorldX, gameWorldOffRef.current);
    const avoiding = Date.now() < avoidPlayerUntil.current;

    if (avoiding) {
      if (curPct <= 50) return pctToWorld(rndBetween(SCREEN_MIN, 12));
      return pctToWorld(rndBetween(88, SCREEN_MAX));
    }

    if (Math.random() < 0.25) {
      return pctToWorld(
        curPct < 50
          ? rndBetween(SCREEN_MIN, prefLo)
          : rndBetween(prefHi, SCREEN_MAX),
      );
    }
    return pctToWorld(rndBetween(
      Math.max(SCREEN_MIN, prefLo),
      Math.min(SCREEN_MAX, prefHi),
    ));
  };

  const fleeFromPlayer = () => {
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

  // ── Entry ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      worldXRef.current = pctToWorld(startX);
      // Always pick an on-screen entry target so the NPC walks into view.
      const entryTargetPct = rndBetween(25, 75);
      targetWorldRef.current = pctToWorld(entryTargetPct);
      facingRef.current = entryTargetPct > startX ? 'right' : 'left';
      walkingRef.current = true;
      stateRef.current = 'wandering';
      // setActive triggers a render → useLayoutEffect will sync facing/walking.
      setActive(true);
    }, entryDelay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryDelay, startX]);

  // ── Decision loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;

    const decide = () => {
      if (pausedRef.current) {
        timer = setTimeout(decide, 500);
        return;
      }

      if (stateRef.current === 'idle') {
        stateRef.current = 'wandering';
        targetWorldRef.current = pickWanderTarget(worldXRef.current);
        applyFacing(targetWorldRef.current > worldXRef.current ? 'right' : 'left');
        applyWalking(true);
        timer = setTimeout(decide, rndBetween(4000, 10_000));
        return;
      }

      stateRef.current = 'idle';
      applyWalking(false);
      timer = setTimeout(decide, rndBetween(...personality.idleMs));
    };

    timer = setTimeout(decide, rndBetween(800, 2000));

    const jumpInterval = setInterval(() => {
      if (!pausedRef.current && Math.random() < personality.jumpiness && !jumpingRef.current) {
        jumpingRef.current = true;
        setJumping(true);
        if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
        jumpTimerRef.current = setTimeout(() => {
          jumpTimerRef.current = null;
          jumpingRef.current   = false;
          setJumping(false);
        }, 560);
      }
    }, rndBetween(2500, 6000));

    return () => {
      clearTimeout(timer);
      clearInterval(jumpInterval);
      if (jumpTimerRef.current) { clearTimeout(jumpTimerRef.current); jumpTimerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, personality]);

  // ── Movement RAF — position via divRef, facing/walking via CharacterHandle ──
  useEffect(() => {
    if (!active) return;

    const loop = () => {
      const off = gameWorldOffRef.current;

      if (!pausedRef.current && stateRef.current === 'wandering') {
        const target = targetWorldRef.current;
        const cur    = worldXRef.current;
        const diff   = target - cur;
        const spd    = speedPx();

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

      // Position — direct DOM, no React state.
      const pct = worldXToScreenPct(worldXRef.current, off);
      screenXRef.current = pct;
      if (divRef.current) divRef.current.style.left = `${pct}%`;
      onMoveRef.current(worldXRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, personality]);

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
      style={{
        position: 'absolute',
        left: `${startX}%`,
        bottom: CHAR_BOTTOM,
        zIndex: greeting ? 200 : 18,
      }}
    >
      <div style={{ animation: jumping ? 'ch-jump-outer 0.55s linear' : 'none' }}>
        <Character
          ref={characterRef}
          // Initial values only — imperative setFacing/setWalking take over after mount.
          walking={walkingRef.current}
          facing={facingRef.current}
          dancing={dancing && !greeting}
          balloonColor={balloonColor}
          accessory={accessory}
          scale={scale}
          bubbleSide={screenXToBubbleSide(screenX)}
          chatOverlay={greeting && greetingChat ? (
            <NpcChatOverlay
              name={greetingChat.name}
              npcTyping={greetingChat.npcTyping}
              npcMessage={greetingChat.npcMessage}
              side={screenXToBubbleSide(screenX)}
            />
          ) : undefined}
        />
      </div>
    </div>
  );
}
