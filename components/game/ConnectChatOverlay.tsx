'use client';

import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import { worldXToScreenPct } from './NPC';
import {
  AttachedInputBubble,
  AttachedHint,
  ConnectedChatThread,
  ChatBubbleStack,
  DualSpeakerChatThread,
  connectedChatMidpointOffsetPx,
  playerBubbleSide,
  type BubbleSide,
  type SpeakerProfile,
} from './ChatBubble';
import { buildChatThread, type ChatLine, type KeyedChatLine } from '@/lib/chatLines';
import {
  chatConnectSpreadPlayerPx,
  chatConnectSpreadPx,
} from '@/lib/chatConnectSpread';
import { CHAR_BOTTOM, NPC_PAIR_CHAT_LIFT_PX } from './groundLayout';
import { Z_CHAT_OVERLAY } from '@/lib/zLayers';

type ChatMode = null | 'chat' | 'ambient';

export function NpcChatOverlay({
  name,
  npcTyping,
  messages,
  side,
  glowColor,
}: {
  name: string;
  npcTyping: boolean;
  messages: ChatLine[];
  side: BubbleSide;
  glowColor?: string;
}) {
  if (!npcTyping && messages.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 6,
        width: '100%',
      }}
    >
      <ChatBubbleStack
        messages={messages}
        name={name}
        side={side}
        glowColor={glowColor}
        nameOnEveryBubble
        showTailOnNewest={false}
      />
    </div>
  );
}

/** Unified NPC↔NPC thread — centered between speakers, tracks camera each frame. */
export function NpcPairChatOverlay({
  lines,
  speakers,
  worldXA,
  worldXB,
  typingSpeakerKey,
}: {
  lines: KeyedChatLine[];
  speakers: [Omit<SpeakerProfile, 'screenPct'>, Omit<SpeakerProfile, 'screenPct'>];
  worldXA: number;
  worldXB: number;
  /** Shown while waiting for the first line from PartyKit. */
  typingSpeakerKey?: string | null;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [screenPcts, setScreenPcts] = useState<[number, number]>(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const off = gameWorldOffRef.current;
    return [
      worldXToScreenPct(worldXA, off, vw),
      worldXToScreenPct(worldXB, off, vw),
    ];
  });

  useLayoutEffect(() => {
    let raf = 0;
    const tick = () => {
      const vw = window.innerWidth;
      const off = gameWorldOffRef.current;
      const aPct = worldXToScreenPct(worldXA, off, vw);
      const bPct = worldXToScreenPct(worldXB, off, vw);
      const spreadA = chatConnectSpreadPx(aPct);
      const spreadB = chatConnectSpreadPx(bPct);
      const aCenterPx = (aPct / 100) * vw + spreadA;
      const bCenterPx = (bPct / 100) * vw + spreadB;
      const midScreenPct = ((aCenterPx + bCenterPx) / 2 / vw) * 100;

      if (divRef.current) {
        divRef.current.style.left = `${midScreenPct}%`;
      }
      setScreenPcts(prev =>
        prev[0] === aPct && prev[1] === bPct ? prev : [aPct, bPct],
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [worldXA, worldXB]);

  const trackedSpeakers: [SpeakerProfile, SpeakerProfile] = [
    { ...speakers[0], screenPct: screenPcts[0] },
    { ...speakers[1], screenPct: screenPcts[1] },
  ];

  return (
    <div
      ref={divRef}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: `calc(${CHAR_BOTTOM} + ${NPC_PAIR_CHAT_LIFT_PX}px)`,
        transform: 'translateX(-50%)',
        zIndex: Z_CHAT_OVERLAY,
        width: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
      }}
    >
      <DualSpeakerChatThread
        lines={lines}
        speakers={trackedSpeakers}
        typingSpeakerKey={typingSpeakerKey}
      />
    </div>
  );
}

export function PlayerChatOverlay({
  npcScreenX,
  chatMode,
  playerName,
  messages,
  partnerName,
  playerColor,
  partnerColor,
  partnerMessages,
  partnerTyping,
  chatDraft,
  setChatDraft,
  onSendMessage,
  chatInputRef,
  mobileNativeInput = false,
}: {
  npcScreenX: number;
  chatMode: ChatMode;
  playerName: string | null;
  messages: ChatLine[];
  partnerName: string;
  playerColor: string;
  partnerColor: string;
  partnerMessages: ChatLine[];
  partnerTyping: boolean;
  chatDraft: string;
  setChatDraft: (v: string) => void;
  onSendMessage: (text: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  mobileNativeInput?: boolean;
}) {
  const [vw, setVw] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const thread = useMemo(
    () => buildChatThread(messages, partnerMessages),
    [messages, partnerMessages],
  );

  const side = playerBubbleSide(npcScreenX);
  const playerSpread = chatConnectSpreadPlayerPx(npcScreenX);
  const partnerSpread = chatConnectSpreadPx(npcScreenX);
  const midpointPx = connectedChatMidpointOffsetPx(npcScreenX, vw, playerSpread, partnerSpread);

  if (chatMode === 'chat') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 6,
          width: 300,
          transform: `translateX(${midpointPx}px)`,
        }}
      >
        <ConnectedChatThread
          thread={thread}
          playerName={playerName ?? 'You'}
          partnerName={partnerName}
          playerColor={playerColor}
          partnerColor={partnerColor}
          partnerScreenX={npcScreenX}
          partnerTyping={partnerTyping}
        />
        {!mobileNativeInput && (
          <AttachedInputBubble showTail={false} side="left">
            <input
              ref={chatInputRef}
              value={chatDraft}
              onChange={e => setChatDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && chatDraft.trim()) {
                  onSendMessage(chatDraft.trim());
                }
              }}
              placeholder="Say something…"
              style={{
                border: 'none', outline: 'none', fontSize: 13,
                flex: 1, background: 'transparent', color: '#222',
                fontFamily: 'inherit',
              }}
              autoComplete="off"
            />
            <span style={{ fontSize: 10, color: '#bbb', whiteSpace: 'nowrap' }}>↵ send</span>
          </AttachedInputBubble>
        )}
      </div>
    );
  }

  return (
    <div style={{ transform: `translateX(${midpointPx}px)` }}>
      <AttachedHint side={side}>
        ↵ chat
      </AttachedHint>
    </div>
  );
}

/** Public shout — visible to everyone nearby in the world. */
export function AmbientPlayerOverlay({
  chatMode,
  playerName,
  messages,
  chatDraft,
  setChatDraft,
  onSendMessage,
  chatInputRef,
  side,
  mobileNativeInput = false,
}: {
  chatMode: ChatMode;
  playerName: string | null;
  messages: ChatLine[];
  chatDraft: string;
  setChatDraft: (v: string) => void;
  onSendMessage: (text: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  side: BubbleSide;
  mobileNativeInput?: boolean;
}) {
  const stackAlign = side === 'left' ? 'flex-end' : 'flex-start';
  const stack = (
    <ChatBubbleStack messages={messages} name={playerName ?? undefined} side={side} showTailOnNewest={false} />
  );

  if (chatMode === 'ambient') {
    if (mobileNativeInput) {
      return messages.length > 0 ? stack : null;
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: stackAlign,
          justifyContent: 'flex-end',
          gap: 6,
        }}
      >
        {stack}
        <AttachedInputBubble showTail side={side}>
          <input
            ref={chatInputRef}
            value={chatDraft}
            onChange={e => setChatDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && chatDraft.trim()) {
                onSendMessage(chatDraft.trim());
              }
            }}
            placeholder="Shout something…"
            maxLength={120}
            style={{
              border: 'none', outline: 'none', fontSize: 13,
              flex: 1, background: 'transparent', color: '#222',
              fontFamily: 'inherit',
            }}
            autoComplete="off"
          />
          <span style={{ fontSize: 10, color: '#bbb', whiteSpace: 'nowrap' }}>↵ send</span>
        </AttachedInputBubble>
      </div>
    );
  }

  if (messages.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stack}
      </div>
    );
  }

  return null;
}
