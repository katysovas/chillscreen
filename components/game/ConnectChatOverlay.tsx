'use client';

import { useState, useEffect } from 'react';
import ChatBubble, {
  TypingBubble,
  chatBubbleLayout,
  NPC_CHAT_BOTTOM,
  PLAYER_CHAT_BOTTOM,
  PLAYER_SENT_BOTTOM,
  getConversationSpread,
  CHAT_LAYER_Z,
  type ChatSide,
} from './ChatBubble';
import CHARACTERS from './characters';
import { CHAR_BOTTOM } from './groundLayout';
import { isValidPlayerName, sanitizePlayerNameInput } from '@/lib/playerStorage';

type ChatMode = null | 'name' | 'chat';

type Props = {
  greetingNpc: number;
  greetNpcX: number;
  chatMode: ChatMode;
  playerName: string | null;
  playerMessage: string | null;
  npcTyping: boolean;
  npcMessage: string | null;
  nameDraft: string;
  setNameDraft: (v: string) => void;
  chatDraft: string;
  setChatDraft: (v: string) => void;
  onSaveName: () => void;
  onSendMessage: (text: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
};

export default function ConnectChatOverlay({
  greetingNpc,
  greetNpcX,
  chatMode,
  playerName,
  playerMessage,
  npcTyping,
  npcMessage,
  nameDraft,
  setNameDraft,
  chatDraft,
  setChatDraft,
  onSaveName,
  onSendMessage,
  chatInputRef,
  nameInputRef,
}: Props) {
  const npc = CHARACTERS[greetingNpc];
  const playerSide: ChatSide = greetNpcX < 50 ? 'right' : 'left';
  const npcSide: ChatSide = greetNpcX < 50 ? 'left' : 'right';

  const [vw, setVw] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const spread = getConversationSpread(greetNpcX, vw);
  const playerChat = chatBubbleLayout(playerSide, PLAYER_CHAT_BOTTOM, spread);
  const bubbleStyle = {
    ...playerChat.style,
    background: '#fff',
    borderRadius: 14,
    padding: '7px 10px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    display: 'flex' as const,
    gap: 6,
    alignItems: 'center' as const,
    minWidth: 220,
    maxWidth: 280,
    pointerEvents: 'auto' as const,
    zIndex: CHAT_LAYER_Z,
  };

  return (
    <>
      {/* NPC bubble — anchored at NPC screen position */}
      {(npcTyping || npcMessage) && (
        <div
          style={{
            position: 'absolute',
            left: `${greetNpcX}%`,
            bottom: CHAR_BOTTOM,
            transform: 'translateX(-50%)',
            zIndex: CHAT_LAYER_Z,
            pointerEvents: 'none',
          }}
        >
          <div style={{ position: 'relative', width: 0, height: 0 }}>
            {npcTyping ? (
              <TypingBubble
                name={npc.name}
                side={npcSide}
                bottomOffset={NPC_CHAT_BOTTOM}
                spreadPx={spread}
              />
            ) : (
              <ChatBubble
                name={npc.name}
                message={npcMessage!}
                side={npcSide}
                bottomOffset={NPC_CHAT_BOTTOM}
                spreadPx={spread}
              />
            )}
          </div>
        </div>
      )}

      {/* Player bubbles + input — anchored at player center */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: CHAR_BOTTOM,
          transform: 'translateX(-50%)',
          zIndex: CHAT_LAYER_Z + 1,
          pointerEvents: chatMode ? 'auto' : 'none',
        }}
      >
        <div style={{ position: 'relative', width: 0, height: 0 }}>
          {chatMode === 'name' && (
            <div style={{
              ...bubbleStyle,
              animation: `${playerSide === 'right' ? 'chat-in-right' : 'chat-in-left'} 0.22s ease-out both`,
            }}>
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
              <div style={playerChat.tailStyle} />
            </div>
          )}

          {chatMode === 'chat' && (
            <>
              {playerMessage && (
                <ChatBubble
                  name={playerName ?? undefined}
                  message={playerMessage}
                  side={playerSide}
                  bottomOffset={PLAYER_SENT_BOTTOM}
                  spreadPx={spread}
                />
              )}
              <div style={{
                ...bubbleStyle,
                animation: `${playerSide === 'right' ? 'chat-in-right' : 'chat-in-left'} 0.22s ease-out both`,
              }}>
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
                <div style={playerChat.tailStyle} />
              </div>
            </>
          )}

          {!chatMode && (
            <div style={{
              ...playerChat.style,
              zIndex: CHAT_LAYER_Z,
              color: 'rgba(255,255,255,0.55)', fontSize: 10,
              letterSpacing: 1.5, textTransform: 'uppercase',
              fontFamily: "Georgia,'Times New Roman',serif",
              whiteSpace: 'nowrap',
              animation: `${playerSide === 'right' ? 'chat-in-right' : 'chat-in-left'} 0.3s ease-out both`,
            }}>
              {playerName ? '↵ chat' : '↵ enter name'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
