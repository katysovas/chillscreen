'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  AttachedInputBubble,
  AttachedHint,
  AttachedTypingBubble,
  ConnectedChatThread,
  ChatBubbleStack,
  connectedChatMidpointOffsetPx,
  playerBubbleSide,
  type BubbleSide,
} from './ChatBubble';
import { buildChatThread, type ChatLine } from '@/lib/chatLines';
import {
  chatConnectSpreadPlayerPx,
  chatConnectSpreadPx,
} from '@/lib/chatConnectSpread';

type ChatMode = null | 'chat' | 'ambient';

export function NpcChatOverlay({
  name,
  npcTyping,
  messages,
  side,
}: {
  name: string;
  npcTyping: boolean;
  messages: ChatLine[];
  side: BubbleSide;
}) {
  if (!npcTyping && messages.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 6,
      }}
    >
      <ChatBubbleStack messages={messages} name={name} side={side} />
      {npcTyping && <AttachedTypingBubble name={messages.length === 0 ? name : undefined} side={side} />}
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
