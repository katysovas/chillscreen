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

type ChatMode = null | 'chat' | 'ambient';

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
  mobileNativeInput = false,
}: {
  npcScreenX: number;
  chatMode: ChatMode;
  playerName: string | null;
  playerMessage: string | null;
  chatDraft: string;
  setChatDraft: (v: string) => void;
  onSendMessage: (text: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  /** Mobile uses a fixed bottom bar — only show sent bubbles here. */
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
        {!mobileNativeInput && (
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
        )}
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

/** Public shout — visible to everyone nearby in the world. */
export function AmbientPlayerOverlay({
  chatMode,
  playerName,
  ambientMessage,
  chatDraft,
  setChatDraft,
  onSendMessage,
  chatInputRef,
  side,
  mobileNativeInput = false,
}: {
  chatMode: ChatMode;
  playerName: string | null;
  ambientMessage: string | null;
  chatDraft: string;
  setChatDraft: (v: string) => void;
  onSendMessage: (text: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  side: BubbleSide;
  mobileNativeInput?: boolean;
}) {
  const stackAlign = side === 'left' ? 'flex-end' : 'flex-start';

  if (chatMode === 'ambient') {
    if (mobileNativeInput) {
      return ambientMessage ? (
        <AttachedChatBubble
          name={playerName ?? undefined}
          message={ambientMessage}
          showTail={false}
          side={side}
        />
      ) : null;
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: stackAlign,
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        {ambientMessage && (
          <AttachedChatBubble
            name={playerName ?? undefined}
            message={ambientMessage}
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

  if (ambientMessage) {
    return (
      <AttachedChatBubble
        name={playerName ?? undefined}
        message={ambientMessage}
        side={side}
      />
    );
  }

  return null;
}
