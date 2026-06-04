'use client';
import type { CSSProperties } from 'react';

export type ChatSide = 'left' | 'right';

type Props = {
  name?: string;
  message: string;
  /** Which side of the character the bubble sits on. */
  side: ChatSide;
  bottomOffset?: number;
  spreadPx?: number;
  animate?: boolean;
};

/** Shared layout for bubbles and the player input — keeps conversation spacing consistent. */
export function chatBubbleLayout(
  side: ChatSide,
  bottomOffset = 130,
  /** Extra px pushing the bubble away from the character (and the other speaker). */
  spreadPx = 0,
): { style: CSSProperties; tailStyle: CSSProperties; animation: string } {
  const charInset = 14; // tail anchor — smaller = bubble sits further from character center
  const tailInset = 22;
  const outward = spreadPx + charInset;

  if (side === 'left') {
    return {
      style: {
        position: 'absolute',
        bottom: bottomOffset,
        left: 0,
        transform: `translateX(calc(-100% - ${spreadPx}px + ${charInset}px))`,
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
      transform: `translateX(calc(-${outward}px))`,
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

/** Chat always paints above everything in the scene. */
export const CHAT_Z = 1000;
export const CHAT_LAYER_Z = 1000;

/** Minimum horizontal push away from each character center. */
export const CONVERSATION_SPREAD = 28;

/** Typical bubble width used to compute spread when speakers are close. */
const BUBBLE_EST_WIDTH = 240;

/**
 * Push bubbles outward so they don't overlap when player (50%) and NPC are nearby.
 * Spread increases as center-to-center distance shrinks.
 */
export function getConversationSpread(greetNpcX: number, viewportWidth: number): number {
  const distPx = (Math.abs(50 - greetNpcX) / 100) * viewportWidth;
  const needed = (BUBBLE_EST_WIDTH - distPx) / 2 + 16;
  const spread = Math.max(CONVERSATION_SPREAD, Math.round(needed));

  const npcAnchorPx = (greetNpcX / 100) * viewportWidth;
  const playerAnchorPx = viewportWidth / 2;
  const npcOnLeft = greetNpcX < 50;
  const maxForNpc = npcOnLeft
    ? npcAnchorPx * 0.8
    : (viewportWidth - npcAnchorPx) * 0.8;
  const maxForPlayer = npcOnLeft
    ? (viewportWidth - playerAnchorPx) * 0.8
    : playerAnchorPx * 0.8;

  return Math.min(spread, maxForNpc, maxForPlayer);
}

/** Vertical offsets — NPC higher, sent message mid, input lowest. */
export const NPC_CHAT_BOTTOM    = 200;
export const PLAYER_SENT_BOTTOM = 128;
export const PLAYER_CHAT_BOTTOM = 72;

export default function ChatBubble({
  name,
  message,
  side,
  bottomOffset = 130,
  spreadPx = CONVERSATION_SPREAD,
  animate = true,
}: Props) {
  const { style, tailStyle } = chatBubbleLayout(side, bottomOffset, spreadPx);

  return (
    <div
      style={{
        ...style,
        background: '#fff',
        borderRadius: 14,
        padding: name ? '7px 13px 8px' : '8px 13px',
        minWidth: 130,
        maxWidth: 260,
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

const DOT_STYLE: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#999',
  display: 'inline-block',
};

/** Animated typing indicator shown while waiting for an NPC reply. */
export function TypingBubble({
  name,
  side,
  bottomOffset = NPC_CHAT_BOTTOM,
  spreadPx = CONVERSATION_SPREAD,
}: {
  name?: string;
  side: ChatSide;
  bottomOffset?: number;
  spreadPx?: number;
}) {
  const { style, tailStyle } = chatBubbleLayout(side, bottomOffset, spreadPx);

  return (
    <div
      style={{
        ...style,
        background: '#fff',
        borderRadius: 14,
        padding: name ? '7px 13px 8px' : '8px 13px',
        minWidth: 72,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        zIndex: CHAT_Z,
        animation: `${side === 'right' ? 'chat-in-right' : 'chat-in-left'} 0.22s ease-out both`,
      }}
    >
      <style>{`
        @keyframes chat-typing-dot {
          0%, 70%, 100% { opacity: 0.35; transform: translateY(0); }
          35% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
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
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0 4px' }}>
        {[0, 0.18, 0.36].map((delay, i) => (
          <span
            key={i}
            style={{
              ...DOT_STYLE,
              animation: `chat-typing-dot 1.1s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>
      <div style={tailStyle} />
    </div>
  );
}
