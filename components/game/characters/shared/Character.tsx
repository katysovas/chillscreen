'use client';
import { forwardRef, useImperativeHandle, useRef, type CSSProperties, type ReactNode } from 'react';
import type { BubbleSide } from '../../ChatBubble';
import {
  accessoryHoldSide,
  renderAccessorySlot,
} from '../render';
import type { CharacterAccessory } from '../types';

export type CharacterProps = {
  walking: boolean;
  facing: 'left' | 'right';
  balloonColor?: string;
  accessory?: CharacterAccessory;
  scale?: number;
  /** Outfit skin — adds `ch-outfit-{name}` on the wrapper (tie-dye, neon tank, …). */
  outfit?: string;
  dancing?: boolean;
  /** Which side of the character the chat stack sits on (screen position). */
  bubbleSide?: BubbleSide;
  /** Chat UI — pinned above the head on `bubbleSide`. */
  chatOverlay?: ReactNode;
};

/** Imperative handle for the direct-DOM updates used by the NPC RAF loop. */
export type CharacterHandle = {
  /** Flip direction — updates style.transform directly, zero React re-render. */
  setFacing: (f: 'left' | 'right') => void;
  /** Toggle walk animation — updates classList directly, zero React re-render. */
  setWalking: (w: boolean) => void;
};

/** Artboard coords (500×240) — above the head, aligned to the sprite body. */
const CHAT_ANCHOR = {
  /** Body left edge ~165px; anchor near top-left of head. */
  left: 172,
  /** Balloons extend right — keep existing offset (looks correct). */
  right: 48,
  top: -68,
};

function chatAnchorStyle(side: BubbleSide, scale: number, mirrored: boolean) {
  const counterScale = `scale(${1 / scale}) scaleX(${mirrored ? -1 : 1})`;
  const shared = {
    position: 'absolute' as const,
    top: CHAT_ANCHOR.top,
    zIndex: 40,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-end' as const,
    gap: 8,
    pointerEvents: 'auto' as const,
  };

  if (side === 'right') {
    return {
      ...shared,
      right: CHAT_ANCHOR.right,
      transform: `translate(0, -100%) ${counterScale}`,
      transformOrigin: 'bottom left',
      alignItems: 'flex-start',
    };
  }

  return {
    ...shared,
    left: CHAT_ANCHOR.left,
    transform: `translate(-100%, -100%) ${counterScale}`,
    transformOrigin: 'bottom right',
    alignItems: 'flex-end',
  };
}

const Character = forwardRef<CharacterHandle, CharacterProps>(function Character({
  walking,
  facing,
  balloonColor = '#ef4023',
  accessory,
  scale = 0.34,
  outfit,
  dancing = false,
  bubbleSide = 'left',
  chatOverlay,
}, ref) {
  const outerRef       = useRef<HTMLDivElement>(null);
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const chatAnchorRef  = useRef<HTMLDivElement>(null);
  const bubbleSideRef  = useRef(bubbleSide);
  bubbleSideRef.current = bubbleSide;
  const scaleRef       = useRef(scale);
  scaleRef.current     = scale;

  useImperativeHandle(ref, () => ({
    setFacing(f) {
      if (!outerRef.current) return;
      const m = f === 'left';
      outerRef.current.style.transform = `translateX(-50%) scaleX(${m ? -1 : 1})`;
      outerRef.current.style.setProperty('--ch-mirror', m ? '-1' : '1');
      if (chatAnchorRef.current) {
        const sc = scaleRef.current;
        const s  = bubbleSideRef.current ?? 'left';
        const counterScale = `scale(${1 / sc}) scaleX(${m ? -1 : 1})`;
        chatAnchorRef.current.style.transform = s === 'right'
          ? `translate(0, -100%) ${counterScale}`
          : `translate(-100%, -100%) ${counterScale}`;
      }
    },
    setWalking(w) {
      if (!wrapperRef.current) return;
      wrapperRef.current.classList.toggle('ch-walking', w);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const mirrored = facing === 'left';
  const partyHandClass = dancing
    ? accessoryHoldSide(accessory) === 'right'
      ? ' ch-free-hand-left'
      : ' ch-free-hand-right'
    : '';

  return (
    <div
      ref={outerRef}
      style={{
        transform: `translateX(-50%) scaleX(${mirrored ? -1 : 1})`,
        ['--ch-mirror' as string]: mirrored ? '-1' : '1',
        transformOrigin: 'center bottom',
        transition: dancing ? undefined : 'transform 0.1s ease',
      } as CSSProperties}
    >
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'bottom center',
        position: 'relative',
      }}>
        <div
          ref={wrapperRef}
          className={`ch-wrapper${outfit ? ` ch-outfit-${outfit}` : ''}${walking ? ' ch-walking' : ''}${dancing ? ' ch-dancing' : ''}${partyHandClass}`}
        >
          <div className="ch-animal">
            {renderAccessorySlot('float', accessory, balloonColor)}
            <div className="ch-ears" />
            <div className="ch-body">
              {renderAccessorySlot('head', accessory, balloonColor)}
              <div className="ch-eyes" />
              <div className="ch-nose"><span /><span /></div>
              <div className="ch-hands">
                <div className="ch-left-hand"><span /><span /></div>
                <div className="ch-right-hand">
                  <span /><span />
                  {renderAccessorySlot('hand', accessory, balloonColor)}
                </div>
              </div>
            </div>
            <div className="ch-legs"><span /><span /></div>
          </div>
        </div>

        {chatOverlay && (
          <div ref={chatAnchorRef} style={chatAnchorStyle(bubbleSide, scale, mirrored)}>
            {chatOverlay}
          </div>
        )}
      </div>
    </div>
  );
});

export default Character;
