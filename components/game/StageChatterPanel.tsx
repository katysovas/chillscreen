'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { filterChatMessage } from '@/lib/messageFilter';
import type { StageChatterMessage } from '@/lib/stageChatter/types';
import { Z_CONTROLS } from '@/lib/zLayers';

const PANEL_STYLES = `
@keyframes stage-chatter-glow {
  0%, 100% { box-shadow: 0 0 18px rgba(255, 120, 200, 0.22), 0 0 36px rgba(120, 200, 255, 0.12), inset 0 0 24px rgba(255, 255, 255, 0.03); }
  50% { box-shadow: 0 0 22px rgba(255, 160, 120, 0.28), 0 0 42px rgba(160, 120, 255, 0.16), inset 0 0 28px rgba(255, 255, 255, 0.05); }
}
@keyframes stage-chatter-typing {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
`;

type Props = {
  messages: StageChatterMessage[];
  typingSenders: string[];
  resolveName: (sender: string) => string;
  resolveGlow?: (sender: string) => string | undefined;
  onSend: (text: string) => void;
  onTypingChange?: (typing: boolean) => void;
  hidden?: boolean;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function CollapseIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      style={{
        transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
        transition: 'transform 0.2s ease',
      }}
    >
      <path
        d="M2.5 7.5L6 4l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StageChatterPanel({
  messages,
  typingSenders,
  resolveName,
  resolveGlow,
  onSend,
  onTypingChange,
  hidden = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLInputElement>(null);
  const stickToBottomRef = useRef(true);
  const typingHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expanded, setExpanded] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (hidden || !expanded) return;
    if (stickToBottomRef.current) scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
  }, [expanded, hidden, messages.length, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = dist < 48;
  }, []);

  const handleSubmit = useCallback(() => {
    const raw = draftRef.current?.value ?? '';
    const filtered = filterChatMessage(raw);
    if (!filtered.ok) return;
    if (draftRef.current) draftRef.current.value = '';
    onTypingChange?.(false);
    onSend(filtered.text);
    stickToBottomRef.current = true;
    requestAnimationFrame(() => scrollToBottom('smooth'));
  }, [onSend, onTypingChange, scrollToBottom]);

  const signalTyping = useCallback(() => {
    onTypingChange?.(true);
    if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
    typingHideTimerRef.current = setTimeout(() => {
      typingHideTimerRef.current = null;
      onTypingChange?.(false);
    }, 1200);
  }, [onTypingChange]);

  const rows = useMemo(
    () => messages.map(msg => ({
      ...msg,
      name: resolveName(msg.sender),
      glow: resolveGlow?.(msg.sender),
    })),
    [messages, resolveGlow, resolveName],
  );

  const typingRows = useMemo(
    () => typingSenders.map(sender => ({
      sender,
      name: resolveName(sender),
      glow: resolveGlow?.(sender),
    })),
    [typingSenders, resolveGlow, resolveName],
  );

  useEffect(() => () => {
    if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
    onTypingChange?.(false);
  }, [onTypingChange]);

  if (hidden) return null;

  return (
    <div
      data-paraloid-ui
      className="hidden md:flex"
      style={{
        position: 'absolute',
        right: 14,
        top: 50,
        zIndex: Z_CONTROLS,
        width: 280,
        height: expanded ? 800 : 'auto',
        maxHeight: expanded ? 'calc(100vh - 220px)' : undefined,
        flexDirection: 'column',
        borderRadius: 16,
        background: 'linear-gradient(165deg, rgba(12, 8, 28, 0.82) 0%, rgba(20, 12, 36, 0.88) 100%)',
        border: '1px solid rgba(255, 180, 220, 0.22)',
        backdropFilter: 'blur(14px)',
        animation: 'stage-chatter-glow 5s ease-in-out infinite',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        pointerEvents: 'auto',
        overflow: 'hidden',
      }}
    >
      <style>{PANEL_STYLES}</style>

      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse stage talk' : 'Expand stage talk'}
        style={{
          padding: '12px 14px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          width: '100%',
          border: 'none',
          borderBottom: expanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'transparent',
          background: 'transparent',
          cursor: 'pointer',
          color: 'inherit',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffb4dc 0%, #ff6eb4 70%)',
            boxShadow: '0 0 10px rgba(255, 110, 180, 0.8)',
            flexShrink: 0,
          }}
          aria-hidden
        />
        <span
          style={{
            flex: 1,
            fontSize: 10,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: 'rgba(255, 220, 240, 0.82)',
            fontWeight: 600,
          }}
        >
          Stage Talk
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 6,
            color: 'rgba(255, 220, 240, 0.65)',
            background: 'rgba(255, 255, 255, 0.06)',
            flexShrink: 0,
          }}
        >
          <CollapseIcon expanded={expanded} />
        </span>
      </button>

      {expanded && (
      <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {rows.length === 0 ? (
          <p
            style={{
              margin: '12px 4px',
              fontSize: 11,
              lineHeight: 1.5,
              color: 'rgba(255, 255, 255, 0.38)',
              textAlign: 'center',
            }}
          >
            The stage is quiet..
          </p>
        ) : (
          rows.map(msg => (
            <div
              key={`${msg.ts}-${msg.sender}-${msg.text}`}
              style={{
                fontSize: 11,
                lineHeight: 1.45,
                color: 'rgba(255, 255, 255, 0.88)',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: msg.glow ?? 'rgba(180, 220, 255, 0.95)',
                  textShadow: msg.glow
                    ? `0 0 12px ${msg.glow}88`
                    : '0 0 10px rgba(140, 200, 255, 0.35)',
                }}
              >
                {msg.name}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.35)', margin: '0 4px' }}>:</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.82)' }}>{msg.text}</span>
              <span
                style={{
                  display: 'block',
                  marginTop: 2,
                  fontSize: 9,
                  letterSpacing: 0.4,
                  color: 'rgba(255, 255, 255, 0.28)',
                }}
              >
                {formatTime(msg.ts)}
              </span>
            </div>
          ))
        )}

        {typingRows.length > 0 && (
          <div
            style={{
              marginTop: 2,
              paddingTop: 6,
              borderTop: '1px dashed rgba(255,255,255,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {typingRows.map(row => (
              <div key={row.sender} style={{ fontSize: 10, lineHeight: 1.35 }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: row.glow ?? 'rgba(180, 220, 255, 0.9)',
                    textShadow: row.glow ? `0 0 10px ${row.glow}88` : 'none',
                  }}
                >
                  {row.name}
                </span>
                <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.62)' }}>
                  <span style={{ animation: 'stage-chatter-typing 1s ease-in-out infinite' }}>...</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: '10px 12px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 10,
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 200, 230, 0.14)',
            boxShadow: 'inset 0 0 12px rgba(255, 120, 200, 0.06)',
          }}
        >
          <input
            ref={draftRef}
            type="text"
            maxLength={120}
            placeholder="Say something…"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
                return;
              }
            }}
            onChange={() => signalTyping()}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 11,
              fontFamily: 'inherit',
            }}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleSubmit}
            aria-label="Send stage chatter"
            style={{
              border: 'none',
              borderRadius: 7,
              padding: '4px 8px',
              fontSize: 10,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: 'rgba(255, 240, 250, 0.9)',
              background: 'linear-gradient(135deg, rgba(255, 100, 180, 0.45), rgba(140, 120, 255, 0.4))',
              boxShadow: '0 0 10px rgba(255, 120, 200, 0.25)',
            }}
          >
            Send
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
