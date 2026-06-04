'use client';
import type { CSSProperties } from 'react';

export type ChatSide = 'left' | 'right';

type Props = {
  name?: string;
  message: string;
  /** Which side of the character the bubble sits on. */
  side: ChatSide;
  bottomOffset?: number;
  animate?: boolean;
};

/** Shared layout for bubbles and the player input — keeps conversation spacing consistent. */
export function chatBubbleLayout(
  side: ChatSide,
  bottomOffset = 130,
): { style: CSSProperties; tailStyle: CSSProperties; animation: string } {
  const charInset = 36; // px of bubble edge overlapping toward character center (for tail)
  const tailInset = 22;

  if (side === 'left') {
    return {
      style: {
        position: 'absolute',
        bottom: bottomOffset,
        left: 0,
        transform: `translateX(calc(-100% + ${charInset}px))`,
      },
      tailStyle: {
        position: 'absolute',
        bottom: -7,
        right: tailInset,
        width: 0,
        height: 0,
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: '7px solid #fff',
        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.07))',
      },
      animation: 'chat-in-left',
    };
  }

  return {
    style: {
      position: 'absolute',
      bottom: bottomOffset,
      left: 0,
      transform: `translateX(-${charInset}px)`,
    },
    tailStyle: {
      position: 'absolute',
      bottom: -7,
      left: tailInset,
      width: 0,
      height: 0,
      borderLeft: '7px solid transparent',
      borderRight: '7px solid transparent',
      borderTop: '7px solid #fff',
      filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.07))',
    },
    animation: 'chat-in-right',
  };
}

/** Chat always paints above character art (balloons, hands, etc.). */
export const CHAT_Z = 50;

/** Vertical offsets — NPC slightly higher, player slightly lower, no overlap. */
export const NPC_CHAT_BOTTOM    = 140;
export const PLAYER_CHAT_BOTTOM = 122;

export default function ChatBubble({
  name,
  message,
  side,
  bottomOffset = 130,
  animate = true,
}: Props) {
  const { style, tailStyle } = chatBubbleLayout(side, bottomOffset);

  return (
    <div
      style={{
        ...style,
        background: '#fff',
        borderRadius: 14,
        padding: name ? '7px 13px 8px' : '8px 13px',
        minWidth: 110,
        maxWidth: 200,
        textAlign: 'left',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        zIndex: CHAT_Z,
        animation: animate ? `${side === 'right' ? 'chat-in-right' : 'chat-in-left'} 0.22s ease-out both` : 'none',
        lineHeight: 1.4,
      }}
    >
      {name && (
        <div style={{
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: '#888',
          marginBottom: 3,
        }}>
          {name}
        </div>
      )}
      <div style={{ fontSize: 13, color: '#222' }}>{message}</div>
      <div style={tailStyle} />
    </div>
  );
}
