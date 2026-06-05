'use client';

import { useState, useEffect } from 'react';
import {
  AttachedChatBubble,
  AttachedTypingBubble,
  AttachedInputBubble,
  AttachedHint,
  getConversationSpread,
  playerBubbleSide,
  type BubbleSide,
} from './ChatBubble';

type ChatMode = null | 'chat';

export function NpcChatOverlay({
  name,
  npcTyping,
  npcMessage,
  side,
}: {
  name: string;
  npcTyping: boolean;
  npcMessage: string | null;
  side: BubbleSide;
}) {
  if (!npcTyping && !npcMessage) return null;

  return npcTyping ? (
    <AttachedTypingBubble name={name} side={side} />
  ) : (
    <AttachedChatBubble name={name} message={npcMessage!} side={side} />
  );
}

export function PlayerChatOverlay({
  npcScreenX,
  chatMode,
  playerName,
  playerMessage,
  chatDraft,
  setChatDraft,
  onSendMessage,
  chatInputRef,
}: {
  npcScreenX: number;
  chatMode: ChatMode;
  playerName: string | null;
  playerMessage: string | null;
  chatDraft: string;
  setChatDraft: (v: string) => void;
  onSendMessage: (text: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [vw, setVw] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const spread = getConversationSpread(npcScreenX, vw, playerBubbleSide(npcScreenX));
  const side = playerBubbleSide(npcScreenX);
  const stackAlign = side === 'left' ? 'flex-end' : 'flex-start';

  if (chatMode === 'chat') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: stackAlign,
          justifyContent: 'flex-end',
          gap: 8,
          ...spread,
        }}
      >
        {playerMessage && (
          <AttachedChatBubble
            name={playerName ?? undefined}
            message={playerMessage}
            showTail={false}
            side={side}
          />
        )}
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
      </div>
    );
  }

  return (
    <div style={spread}>
      <AttachedHint side={side}>
        ↵ chat
      </AttachedHint>
    </div>
  );
}
