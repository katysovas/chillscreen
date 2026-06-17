'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAR_BOTTOM } from './groundLayout';
import { worldXToScreenPct } from './NPC';
import { gameWorldOffRef, playerWorldXRef } from '@/lib/gameWorldRef';
import {
  GROUND_SCORE_MAX_COINS,
  GROUND_SCORE_PICKUP_DIST_PX,
  GROUND_SCORE_TEST_DROP_ON_LOAD,
  groundCoinSpawnDelayMs,
  groundCoinWorldX,
  groundCoinValue,
  type GroundCoin as GroundCoinDef,
} from '@/lib/groundScore';

const COIN_CSS = `
@keyframes gs-glint {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}
`;

/** One coin — imperative DOM positioning + pickup check (no React state per frame). */
function GroundCoinSprite({
  coin,
  onPickup,
}: {
  coin: GroundCoinDef;
  onPickup: (coin: GroundCoinDef) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const pickedRef = useRef(false);

  useEffect(() => {
    let raf: number | null = null;
    let frame = 0;

    const loop = () => {
      const off = gameWorldOffRef.current;
      const playerX = playerWorldXRef.current;
      const el = divRef.current;
      if (el) el.style.left = `${worldXToScreenPct(coin.worldX, off)}%`;

      // Throttle pickup checks to every 4 frames (~15 Hz).
      frame++;
      if (
        frame % 4 === 0 &&
        !pickedRef.current &&
        Math.abs(coin.worldX - playerX) < GROUND_SCORE_PICKUP_DIST_PX
      ) {
        pickedRef.current = true;
        onPickup(coin);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [coin, onPickup]);

  return (
    <div
      ref={divRef}
      style={{
        position: 'absolute',
        bottom: `calc(${CHAR_BOTTOM} - 4px)`,
        left: '-30%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        pointerEvents: 'none',
      }}
    >
      <svg width={30} height={34} viewBox="0 0 30 34" aria-hidden>
        <ellipse cx={15} cy={31} rx={11} ry={2.5} fill="rgba(0,0,0,.25)" />
        <circle cx={15} cy={15} r={13} fill="#e8b62c" stroke="#a87b14" strokeWidth={2} />
        <circle cx={15} cy={15} r={9.5} fill="none" stroke="#c79a1e" strokeWidth={1.5} />
        <path
          d="M9 7 Q15 3 21 7"
          fill="none"
          stroke="#ffe9a0"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ animation: 'gs-glint 2.2s ease-in-out infinite' }}
        />
        <text
          x={15}
          y={19}
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontWeight={800}
          fontSize={coin.value === 100 ? 9 : 10}
          fill="#7a5408"
        >
          {coin.value}
        </text>
      </svg>
    </div>
  );
}

type GroundScoreLayerProps = {
  /** Spawning paused while popups are open or in mobile lounge (no walking). */
  active: boolean;
  onPickup: (value: number) => void;
};

/** Ground Score — coins drop on the sidewalk every ~1 min; walk over to collect. */
export function GroundScoreLayer({ active, onPickup }: GroundScoreLayerProps) {
  const [coins, setCoins] = useState<GroundCoinDef[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const drop = () => {
      setCoins(prev => {
        if (prev.length >= GROUND_SCORE_MAX_COINS) return prev;
        const coin: GroundCoinDef = {
          id: ++idRef.current,
          worldX: groundCoinWorldX(playerWorldXRef.current),
          value: groundCoinValue(),
        };
        return [...prev, coin];
      });
    };

    const schedule = () => {
      timer = setTimeout(() => {
        drop();
        schedule();
      }, groundCoinSpawnDelayMs());
    };

    if (GROUND_SCORE_TEST_DROP_ON_LOAD) {
      timer = setTimeout(() => {
        drop();
        schedule();
      }, 1000);
    } else {
      schedule();
    }

    return () => {
      if (timer !== null) clearTimeout(timer);
    };
  }, [active]);

  const handlePickup = useCallback((coin: GroundCoinDef) => {
    setCoins(prev => prev.filter(c => c.id !== coin.id));
    onPickup(coin.value);
  }, [onPickup]);

  if (coins.length === 0) return null;

  return (
    <>
      <style>{COIN_CSS}</style>
      {coins.map(c => (
        <GroundCoinSprite key={c.id} coin={c} onPickup={handlePickup} />
      ))}
    </>
  );
}
