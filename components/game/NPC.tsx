'use client';
import { useState, useEffect, useRef } from 'react';
import Character from './Character';
import { CHAR_BOTTOM } from './groundLayout';

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
  personality: Personality;
  name: string;
};

type State = 'idle' | 'wandering';

type NPCProps = NPCConfig & {
  /** Player world scroll offset — NPCs are anchored in world space, not the viewport. */
  worldOff: number;
  paused: boolean;
  greeting: boolean;
  greetFacing: 'left' | 'right';
  /** Reports world-x each frame (for collision detection). */
  onMove: (worldX: number) => void;
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
  balloonColor, scale = 0.34,
  personality,
  worldOff,
  paused, greeting, greetFacing, onMove,
}: NPCProps) {
  const [screenX,   setScreenX]   = useState(startX);
  const [walking,   setWalking]   = useState(false);
  const [facing,    setFacing]    = useState<'left' | 'right'>(entryDirection);
  const [jumping,   setJumping]   = useState(false);
  const [active,    setActive]    = useState(false);

  const worldXRef         = useRef(0);
  const targetWorldRef    = useRef(0);
  const stateRef          = useRef<State>('idle');
  const pausedRef         = useRef(paused);
  const jumpingRef        = useRef(false);
  const avoidPlayerUntil  = useRef(0);
  const worldOffRef       = useRef(worldOff);
  const rafRef            = useRef<number | null>(null);
  const onMoveRef         = useRef(onMove);

  worldOffRef.current = worldOff;
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

  const speedPx = () => (personality.speed / 100) * vw();

  /** Screen-% target → world-x (anchored to current player position). */
  const pctToWorld = (pct: number) => screenPctToWorldX(pct, worldOffRef.current);

  const pickWanderTarget = (curWorldX: number) => {
    const [prefLo, prefHi] = personality.wanderRange;
    const curPct = worldXToScreenPct(curWorldX, worldOffRef.current);
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
    const curPct = worldXToScreenPct(worldXRef.current, worldOffRef.current);
    const fleeTarget = curPct <= 50
      ? pctToWorld(rndBetween(SCREEN_MIN, 5))
      : pctToWorld(rndBetween(95, SCREEN_MAX));
    targetWorldRef.current = fleeTarget;
    stateRef.current = 'wandering';
    setFacing(fleeTarget > worldXRef.current ? 'right' : 'left');
    setWalking(true);
  };

  // ── Entry ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      worldXRef.current = pctToWorld(startX);
      setActive(true);
      stateRef.current = 'wandering';
      targetWorldRef.current = pickWanderTarget(worldXRef.current);
      setWalking(true);
      setFacing(entryDirection);
    }, entryDelay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryDelay, entryDirection]);

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
        setFacing(targetWorldRef.current > worldXRef.current ? 'right' : 'left');
        setWalking(true);
        timer = setTimeout(decide, rndBetween(4000, 10_000));
        return;
      }

      stateRef.current = 'idle';
      setWalking(false);
      timer = setTimeout(decide, rndBetween(...personality.idleMs));
    };

    timer = setTimeout(decide, rndBetween(800, 2000));

    const jumpInterval = setInterval(() => {
      if (!pausedRef.current && Math.random() < personality.jumpiness && !jumpingRef.current) {
        jumpingRef.current = true;
        setJumping(true);
        setTimeout(() => { jumpingRef.current = false; setJumping(false); }, 560);
      }
    }, rndBetween(2500, 6000));

    return () => { clearTimeout(timer); clearInterval(jumpInterval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, personality]);

  // ── Movement RAF — updates world-x; screen position derived from worldOff ─
  useEffect(() => {
    if (!active) return;

    const loop = () => {
      const off = worldOffRef.current;

      if (!pausedRef.current && stateRef.current === 'wandering') {
        const target = targetWorldRef.current;
        const cur    = worldXRef.current;
        const diff   = target - cur;
        const spd    = speedPx();

        if (Math.abs(diff) < spd) {
          worldXRef.current = target;
          stateRef.current = 'idle';
          setWalking(false);
        } else {
          worldXRef.current += diff > 0 ? spd : -spd;
          setFacing(diff > 0 ? 'right' : 'left');
          setWalking(true);
        }
      }

      setScreenX(worldXToScreenPct(worldXRef.current, off));
      onMoveRef.current(worldXRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, personality]);

  const wasGreetingRef = useRef(false);
  useEffect(() => {
    const justDisconnected = wasGreetingRef.current && !greeting;
    wasGreetingRef.current = greeting;
    if (justDisconnected) fleeFromPlayer();
  }, [greeting]);

  useEffect(() => {
    if (greeting) { setWalking(false); setFacing(greetFacing); }
    else if (paused) setWalking(false);
  }, [paused, greeting, greetFacing]);

  if (!active) return null;

  const displayFacing  = greeting ? greetFacing : facing;
  const displayWalking = greeting || paused ? false : walking;

  return (
    <div style={{
      position: 'absolute',
      left: `${screenX}%`,
      bottom: CHAR_BOTTOM,
      zIndex: greeting ? 200 : 18,
    }}>
      <div style={{ animation: jumping ? 'ch-jump-outer 0.55s linear' : 'none' }}>
        <Character
          walking={displayWalking}
          facing={displayFacing}
          balloonColor={balloonColor}
          scale={scale}
        />
      </div>
    </div>
  );
}
