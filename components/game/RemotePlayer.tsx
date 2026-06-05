'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Character, { type CharacterHandle } from './Character';
import { NpcChatOverlay } from './ConnectChatOverlay';
import { CHAR_BOTTOM } from './groundLayout';
import { screenXToBubbleSide } from './ChatBubble';
import { gameWorldOffRef, worldXToScreenPct } from '@/lib/gameWorldRef';
import type { RemotePlayerState } from '@/lib/multiplayer/useMultiplayer';

type RemotePlayerProps = {
  id: string;
  /** Shared live roster — positions stream in here without re-rendering. */
  stateRef: React.RefObject<Map<string, RemotePlayerState>>;
  scale?: number;
  /** True while the local player is in a 1:1 chat with this player. */
  greeting?: boolean;
  greetingChat?: { name: string; npcTyping: boolean; npcMessage: string | null };
};

/** How quickly the rendered position eases toward the latest networked target. */
const LERP = 0.22;

/**
 * A networked human avatar. Mirrors the NPC's imperative-render approach
 * (position via direct DOM, facing/walking via the Character handle) but its
 * motion is driven by the shared roster ref rather than an AI loop, with light
 * interpolation so 15 Hz packets read as smooth 60 fps movement.
 */
export default function RemotePlayer({
  id, stateRef, scale = 0.34, greeting = false, greetingChat,
}: RemotePlayerProps) {
  const divRef       = useRef<HTMLDivElement>(null);
  const characterRef = useRef<CharacterHandle>(null);
  const renderXRef   = useRef<number | null>(null);
  const facingRef    = useRef<'left' | 'right'>('right');
  const walkingRef   = useRef(false);
  const rafRef       = useRef<number | null>(null);

  const initial = stateRef.current?.get(id);
  const [color, setColor] = useState(initial?.balloonColor ?? '#ef4023');
  const colorRef = useRef(color);
  // screenX only feeds the chat-bubble side; refreshed when a chat opens.
  const [screenX, setScreenX] = useState(50);

  useEffect(() => {
    if (greeting && divRef.current) {
      const pct = parseFloat(divRef.current.style.left) || 50;
      setScreenX(pct);
    }
  }, [greeting]);

  // Keep facing/walking DOM in sync after any React render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    characterRef.current?.setFacing(facingRef.current);
    characterRef.current?.setWalking(walkingRef.current);
  });

  useEffect(() => {
    const loop = () => {
      const s = stateRef.current?.get(id);
      if (s) {
        // Pick up late color/profile corrections without a remount.
        if (s.balloonColor && s.balloonColor !== colorRef.current) {
          colorRef.current = s.balloonColor;
          setColor(s.balloonColor);
        }
        if (renderXRef.current === null) renderXRef.current = s.worldX;
        const diff = s.worldX - renderXRef.current;
        // Snap on large jumps (teleport / first frame), ease on small ones.
        renderXRef.current += Math.abs(diff) > 600 ? diff : diff * LERP;

        if (s.facing !== facingRef.current) {
          facingRef.current = s.facing;
          characterRef.current?.setFacing(s.facing);
        }
        if (s.walking !== walkingRef.current) {
          walkingRef.current = s.walking;
          characterRef.current?.setWalking(s.walking);
        }

        const pct = worldXToScreenPct(renderXRef.current, gameWorldOffRef.current);
        if (divRef.current) divRef.current.style.left = `${pct}%`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // stateRef is stable; id is fixed per mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bubbleSide = screenXToBubbleSide(screenX);

  return (
    <div
      ref={divRef}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: CHAR_BOTTOM,
        zIndex: greeting ? 199 : 17,
      }}
    >
      <Character
        ref={characterRef}
        walking={walkingRef.current}
        facing={facingRef.current}
        balloonColor={color}
        scale={scale}
        bubbleSide={bubbleSide}
        chatOverlay={greeting && greetingChat ? (
          <NpcChatOverlay
            name={greetingChat.name}
            npcTyping={greetingChat.npcTyping}
            npcMessage={greetingChat.npcMessage}
            side={bubbleSide}
          />
        ) : undefined}
      />
    </div>
  );
}
