'use client';
import type { ReactNode } from 'react';
import type { BubbleSide } from './ChatBubble';

export type CharacterProps = {
  walking: boolean;
  facing: 'left' | 'right';
  balloonColor?: string;
  scale?: number;
  dancing?: boolean;
  /** Which side of the character the chat stack sits on (screen position). */
  bubbleSide?: BubbleSide;
  /** Chat UI — pinned above the head on `bubbleSide`. */
  chatOverlay?: ReactNode;
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

export default function Character({
  walking,
  facing,
  balloonColor = '#ef4023',
  scale = 0.34,
  dancing = false,
  bubbleSide = 'left',
  chatOverlay,
}: CharacterProps) {
  const mirrored = facing === 'left';

  return (
    <div style={{
      transform: `translateX(-50%) scaleX(${mirrored ? -1 : 1})`,
      transformOrigin: 'center bottom',
      transition: dancing ? undefined : 'transform 0.1s ease',
    }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'bottom center',
        position: 'relative',
      }}>
        <div className={`ch-wrapper${walking ? ' ch-walking' : ''}${dancing ? ' ch-dancing' : ''}`}>
          <div className="ch-animal">
            <div className="ch-ballons">
              <div className="ch-heart">
                <span style={{ background: balloonColor }} />
                <span style={{ background: balloonColor }} />
              </div>
            </div>
            <div className="ch-ears" />
            <div className="ch-body">
              <div className="ch-eyes" />
              <div className="ch-nose"><span /><span /></div>
              <div className="ch-hands">
                <div className="ch-left-hand"><span /><span /></div>
                <div className="ch-right-hand"><span /><span /></div>
              </div>
            </div>
            <div className="ch-legs"><span /><span /></div>
          </div>
        </div>

        {chatOverlay && (
          <div style={chatAnchorStyle(bubbleSide, scale, mirrored)}>
            {chatOverlay}
          </div>
        )}
      </div>
    </div>
  );
}
