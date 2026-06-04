'use client';
import type { CSSProperties, ReactNode } from 'react';

export type BubbleSide = 'left' | 'right';

/** Bubble sits above the character's left or right side based on screen position. */
export function screenXToBubbleSide(screenX: number): BubbleSide {
  return screenX < 50 ? 'left' : 'right';
}

/** Player is centred — place bubble on the side away from the NPC. */
export function playerBubbleSide(npcScreenX: number): BubbleSide {
  return npcScreenX >= 50 ? 'left' : 'right';
}

function bubbleTailStyle(bubbleSide: BubbleSide): CSSProperties {
  return {
    position: 'absolute',
    bottom: -7,
    ...(bubbleSide === 'left' ? { right: 10 } : { left: 18 }),
    width: 0,
    height: 0,
    borderLeft: '7px solid transparent',
    borderRight: '7px solid transparent',
    borderTop: '7px solid #fff',
    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.07))',
  };
}

const bubbleShell: CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  padding: '8px 13px',
  minWidth: 130,
  maxWidth: 260,
  textAlign: 'left',
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  lineHeight: 1.4,
  position: 'relative',
};

export function AttachedChatBubble({
  name,
  message,
  animate = true,
  showTail = true,
  side = 'left',
}: {
  name?: string;
  message: string;
  animate?: boolean;
  showTail?: boolean;
  side?: BubbleSide;
}) {
  return (
    <div
      style={{
        ...bubbleShell,
        padding: name ? '7px 13px 8px' : '8px 13px',
        animation: animate ? 'chat-in-left 0.22s ease-out both' : undefined,
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
      {showTail && <div style={bubbleTailStyle(side)} />}
    </div>
  );
}

export function AttachedTypingBubble({
  name,
  side = 'left',
}: {
  name?: string;
  side?: BubbleSide;
}) {
  return (
    <div style={{ ...bubbleShell, minWidth: 72, animation: 'chat-in-left 0.22s ease-out both' }}>
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
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#999',
              display: 'inline-block',
              animation: `chat-typing-dot 1.1s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>
      <div style={bubbleTailStyle(side)} />
    </div>
  );
}

export function AttachedInputBubble({
  children,
  animate = true,
  showTail = true,
  side = 'left',
}: {
  children: ReactNode;
  animate?: boolean;
  showTail?: boolean;
  side?: BubbleSide;
}) {
  return (
    <div
      style={{
        ...bubbleShell,
        padding: '7px 10px',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        minWidth: 220,
        maxWidth: 280,
        animation: animate ? 'chat-in-left 0.22s ease-out both' : undefined,
      }}
    >
      {children}
      {showTail && <div style={bubbleTailStyle(side)} />}
    </div>
  );
}

export function AttachedHint({
  children,
  side = 'left',
}: {
  children: ReactNode;
  side?: BubbleSide;
}) {
  return (
    <div style={{
      color: 'rgba(255,255,255,0.55)',
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      fontFamily: "Georgia,'Times New Roman',serif",
      whiteSpace: 'nowrap',
      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
      animation: 'chat-in-left 0.3s ease-out both',
    }}>
      {children}
    </div>
  );
}

/** Extra horizontal nudge when player & NPC are very close (applied to player overlay). */
export function getConversationSpread(
  greetNpcX: number,
  viewportWidth: number,
  bubbleSide: BubbleSide,
): CSSProperties | undefined {
  const distPx = (Math.abs(50 - greetNpcX) / 100) * viewportWidth;
  if (distPx >= 220) return undefined;
  const spread = Math.round((220 - distPx) / 2);
  return bubbleSide === 'left'
    ? { marginLeft: -spread }
    : { marginRight: -spread };
}

export const CHAT_LAYER_Z = 1000;
