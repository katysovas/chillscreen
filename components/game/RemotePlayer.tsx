'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Character, { type CharacterHandle } from './Character';
import { NpcChatOverlay } from './ConnectChatOverlay';
import { CHAR_BOTTOM, mobileCrowdDepthIndex } from './groundLayout';
import { screenXToBubbleSide } from './ChatBubble';
import { gameWorldOffRef, worldXToScreenPct } from '@/lib/gameWorldRef';
import type {
  RemoteAmbientMessage,
  RemotePlayerState,
} from '@/lib/multiplayer/useMultiplayer';
import {
  loadoutFromSync,
  loadoutSyncKey,
} from '@/lib/multiplayer/loadoutSync';
import type { CharacterLoadout } from './characters/loadout';

type RemotePlayerProps = {
  id: string;
  /** Shared live roster — positions stream in here without re-rendering. */
  stateRef: React.RefObject<Map<string, RemotePlayerState>>;
  scale?: number;
  /** True while the local player is in a 1:1 chat with this player. */
  greeting?: boolean;
  greetingChat?: { name: string; npcTyping: boolean; npcMessage: string | null };
  ambientRef?: React.RefObject<Map<string, RemoteAmbientMessage>>;
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
  id, stateRef, scale = 0.34, greeting = false, greetingChat, ambientRef,
}: RemotePlayerProps) {
  const divRef       = useRef<HTMLDivElement>(null);
  const characterRef = useRef<CharacterHandle>(null);
  const renderXRef   = useRef<number | null>(null);
  const facingRef    = useRef<'left' | 'right'>('right');
  const walkingRef   = useRef(false);
  const rafRef       = useRef<number | null>(null);

  const initial = stateRef.current?.get(id);
  const initialColor = initial?.balloonColor ?? '#ef4023';
  const [color, setColor] = useState(initialColor);
  const colorRef = useRef(color);
  const [loadout, setLoadout] = useState<CharacterLoadout>(() =>
    loadoutFromSync(initial?.loadout, initialColor),
  );
  const loadoutKeyRef = useRef(loadoutSyncKey(initial?.loadout));
  // screenX only feeds the chat-bubble side; refreshed when a chat opens.
  const [screenX, setScreenX] = useState(50);
  const [ambientMessage, setAmbientMessage] = useState<string | null>(null);
  const lastAmbientRef = useRef<string | null>(null);

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
          setLoadout(prev => ({ ...prev, balloonColor: s.balloonColor }));
        }
        const nextLoadoutKey = loadoutSyncKey(s.loadout);
        if (nextLoadoutKey !== loadoutKeyRef.current) {
          loadoutKeyRef.current = nextLoadoutKey;
          setLoadout(loadoutFromSync(s.loadout, s.balloonColor));
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

        if (ambientRef?.current) {
          const amb = ambientRef.current.get(id);
          const active = amb && amb.until > Date.now() ? amb.text : null;
          if (active !== lastAmbientRef.current) {
            lastAmbientRef.current = active;
            setAmbientMessage(active);
          }
        }
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
      className="game-character game-character-crowd"
      data-depth={mobileCrowdDepthIndex(id)}
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
        loadout={loadout}
        scale={scale}
        bubbleSide={bubbleSide}
        chatOverlay={
          greeting && greetingChat ? (
            <NpcChatOverlay
              name={greetingChat.name}
              npcTyping={greetingChat.npcTyping}
              npcMessage={greetingChat.npcMessage}
              side={bubbleSide}
            />
          ) : ambientMessage ? (
            <NpcChatOverlay
              name={stateRef.current?.get(id)?.name ?? 'Wanderer'}
              npcTyping={false}
              npcMessage={ambientMessage}
              side={bubbleSide}
            />
          ) : undefined
        }
      />
    </div>
  );
}
