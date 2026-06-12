'use client';
import type { CSSProperties, ReactNode } from 'react';
import { chatBubbleOpacity, type ChatLine, type ChatThreadLine, type KeyedChatLine } from '@/lib/chatLines';

export type BubbleSide = 'left' | 'right' | 'center';

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
  ageFromBottom = 0,
  stackSize = 1,
  variant = 'default',
  glowColor,
}: {
  name?: string;
  message: string;
  animate?: boolean;
  showTail?: boolean;
  side?: BubbleSide;
  /** 0 = newest in stack; higher = older / more faded. */
  ageFromBottom?: number;
  stackSize?: number;
  /** Connected thread — tint by speaker side. */
  variant?: 'default' | 'self' | 'partner';
  /** Balloon color — matches character connect glow. */
  glowColor?: string;
}) {
  const opacity = chatBubbleOpacity(ageFromBottom, stackSize);
  const bg = variant === 'self' ? '#eef6ff' : variant === 'partner' ? '#fff' : '#fff';
  const glow = Boolean(glowColor);
  return (
    <div
      className={`game-chat-bubble game-chat-bubble-stacked${glow ? ' game-chat-bubble-glow' : ''}`}
      style={{
        ...bubbleShell,
        background: glow ? undefined : bg,
        padding: name ? '7px 13px 8px' : '8px 13px',
        opacity,
        maxWidth: variant === 'default' ? 260 : 220,
        animation: animate && ageFromBottom === 0 ? 'chat-in-left 0.22s ease-out both' : undefined,
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        ...(glow ? { ['--glow-color' as string]: glowColor } : {}),
      }}
    >
      {name && (
        <div
          className={glow ? 'game-chat-bubble-name' : undefined}
          style={{
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: glow ? undefined : '#888',
          marginBottom: 3,
        }}
        >
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
  glowColor,
}: {
  name?: string;
  side?: BubbleSide;
  glowColor?: string;
}) {
  const glow = Boolean(glowColor);
  return (
    <div
      className={`game-chat-bubble${glow ? ' game-chat-bubble-glow' : ''}`}
      style={{
        ...bubbleShell,
        minWidth: 72,
        animation: 'chat-in-left 0.22s ease-out both',
        ...(glow ? { ['--glow-color' as string]: glowColor } : {}),
      }}
    >
      {name && (
        <div
          className={glow ? 'game-chat-bubble-name' : undefined}
          style={{
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: glow ? undefined : '#888',
          marginBottom: 3,
        }}
        >
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
      className="game-chat-input-bubble"
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
  const isMobile = viewportWidth <= 767;
  const threshold = isMobile ? 120 : 220;
  const distPx = (Math.abs(50 - greetNpcX) / 100) * viewportWidth;
  if (distPx >= threshold) return undefined;
  const spread = Math.round((threshold - distPx) / 2);
  const cap = isMobile ? Math.round(viewportWidth * 0.1) : spread;
  const nudge = Math.min(spread, cap);
  return bubbleSide === 'left'
    ? { marginLeft: -nudge }
    : { marginRight: -nudge };
}

export { Z_CHAT_OVERLAY as CHAT_LAYER_Z } from '@/lib/zLayers';

/** Stacked chatter — oldest on top, newest at bottom, older lines fade. */
/** Align bubbles to each speaker's screen side (player ~50%, partner at partnerScreenX). */
export function connectedChatSides(partnerScreenPct: number): {
  playerSide: BubbleSide;
  partnerSide: BubbleSide;
} {
  const playerOnRight = partnerScreenPct < 50;
  return {
    playerSide: playerOnRight ? 'right' : 'left',
    partnerSide: playerOnRight ? 'left' : 'right',
  };
}

export type SpeakerProfile = {
  key: string;
  name: string;
  color: string;
  /** Screen position % — used for left/right alignment. */
  screenPct?: number;
  /** World-x — preferred for NPC pair chat (tracks camera scroll). */
  worldX?: number;
};

function speakerSortKey(s: SpeakerProfile): number {
  return s.worldX ?? s.screenPct ?? 0;
}

function sideForSpeaker(speakers: SpeakerProfile[], key: string): BubbleSide {
  if (speakers.length < 2) return 'left';
  const sorted = [...speakers].sort((a, b) => speakerSortKey(a) - speakerSortKey(b));
  const leftKey = sorted[0]!.key;
  return key === leftKey ? 'left' : 'right';
}

/** Single column — each speaker's bubbles align to their screen side with balloon glow. */
export function DualSpeakerChatThread({
  lines,
  speakers,
  typingSpeakerKey,
}: {
  lines: KeyedChatLine[];
  speakers: SpeakerProfile[];
  typingSpeakerKey?: string | null;
}) {
  const byKey = new Map(speakers.map(s => [s.key, s]));
  const total = lines.length;
  if (total === 0 && !typingSpeakerKey) return null;

  return (
    <>
      {lines.map((line, i) => {
        const sp = byKey.get(line.speakerKey);
        if (!sp) return null;
        const ageFromBottom = total - 1 - i;
        const side = sideForSpeaker(speakers, line.speakerKey);
        return (
          <div
            key={line.id}
            style={{
              display: 'flex',
              justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
              width: '100%',
            }}
          >
            <AttachedChatBubble
              name={sp.name}
              message={line.text}
              side={side}
              glowColor={sp.color}
              ageFromBottom={ageFromBottom}
              stackSize={total}
              showTail={false}
              animate={ageFromBottom === 0}
            />
          </div>
        );
      })}
      {typingSpeakerKey && byKey.has(typingSpeakerKey) && (() => {
        const sp = byKey.get(typingSpeakerKey)!;
        const side = sideForSpeaker(speakers, typingSpeakerKey);
        return (
          <div style={{
            display: 'flex',
            justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
            width: '100%',
          }}>
            <AttachedTypingBubble name={sp.name} side={side} glowColor={sp.color} />
          </div>
        );
      })()}
    </>
  );
}

/** Player at 50% + partner — unified connected-chat column. */
export function ConnectedChatThread({
  thread,
  playerName,
  partnerName,
  playerColor,
  partnerColor,
  partnerScreenX,
  partnerTyping,
}: {
  thread: ChatThreadLine[];
  playerName: string;
  partnerName: string;
  playerColor: string;
  partnerColor: string;
  /** Partner screen % — player is at 50%. */
  partnerScreenX: number;
  partnerTyping: boolean;
}) {
  const speakers: SpeakerProfile[] = [
    { key: 'self', name: playerName, color: playerColor, screenPct: 50 },
    { key: 'partner', name: partnerName, color: partnerColor, screenPct: partnerScreenX },
  ];
  const lines: KeyedChatLine[] = thread.map(l => ({
    id: l.id,
    text: l.text,
    at: l.at,
    speakerKey: l.speaker,
  }));
  return (
    <DualSpeakerChatThread
      lines={lines}
      speakers={speakers}
      typingSpeakerKey={partnerTyping ? 'partner' : null}
    />
  );
}

/** Shift a centered chat column to the midpoint between player and partner (incl. chat spread). */
export function connectedChatMidpointOffsetPx(
  partnerScreenPct: number,
  viewportWidth: number,
  playerSpreadPx = 0,
  partnerSpreadPx = 0,
): number {
  const playerCenter = viewportWidth * 0.5 + playerSpreadPx;
  const partnerCenter = (partnerScreenPct / 100) * viewportWidth + partnerSpreadPx;
  return Math.round((playerCenter + partnerCenter) / 2 - playerCenter);
}

export function ChatBubbleStack({
  messages,
  name,
  side = 'left',
  showTailOnNewest = true,
  glowColor,
  nameOnEveryBubble = false,
}: {
  messages: ChatLine[];
  name?: string;
  side?: BubbleSide;
  showTailOnNewest?: boolean;
  glowColor?: string;
  nameOnEveryBubble?: boolean;
}) {
  if (messages.length === 0) return null;
  const total = messages.length;
  return (
    <>
      {messages.map((line, i) => {
        const ageFromBottom = total - 1 - i;
        const isNewest = ageFromBottom === 0;
        return (
          <AttachedChatBubble
            key={line.id}
            name={nameOnEveryBubble || isNewest ? name : undefined}
            message={line.text}
            side={side}
            glowColor={glowColor}
            ageFromBottom={ageFromBottom}
            stackSize={total}
            showTail={showTailOnNewest && isNewest && total === 1}
            animate={isNewest}
          />
        );
      })}
    </>
  );
}
