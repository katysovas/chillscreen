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
import { isValidPlayerName, sanitizePlayerNameInput } from '@/lib/playerStorage';

type ChatMode = null | 'name' | 'chat';

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
  nameDraft,
  setNameDraft,
  chatDraft,
  setChatDraft,
  onSaveName,
  onSendMessage,
  chatInputRef,
  nameInputRef,
}: {
  npcScreenX: number;
  chatMode: ChatMode;
  playerName: string | null;
  playerMessage: string | null;
  nameDraft: string;
  setNameDraft: (v: string) => void;
  chatDraft: string;
  setChatDraft: (v: string) => void;
  onSaveName: () => void;
  onSendMessage: (text: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
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

  if (chatMode === 'name') {
    return (
      <div style={spread}>
        <AttachedInputBubble side={side}>
          <input
            ref={nameInputRef}
            value={nameDraft}
            onChange={e => setNameDraft(sanitizePlayerNameInput(e.target.value))}
            onKeyDown={e => { if (e.key === 'Enter') onSaveName(); }}
            placeholder="Your name…"
            style={{
              border: 'none', outline: 'none', fontSize: 13,
              flex: 1, background: 'transparent', color: '#222',
              fontFamily: 'inherit',
            }}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onSaveName}
            disabled={!isValidPlayerName(nameDraft)}
            style={{
              border: 'none', borderRadius: 8, padding: '4px 10px',
              fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
              cursor: isValidPlayerName(nameDraft) ? 'pointer' : 'default',
              background: isValidPlayerName(nameDraft) ? '#222' : '#ddd',
              color: isValidPlayerName(nameDraft) ? '#fff' : '#999',
            }}
          >
            Save
          </button>
        </AttachedInputBubble>
      </div>
    );
  }

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
        {playerName ? '↵ chat' : '↵ enter name'}
      </AttachedHint>
    </div>
  );
}
