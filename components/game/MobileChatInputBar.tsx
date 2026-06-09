'use client';

import { useEffect, useState } from 'react';

const IDLE_BOTTOM =
  'calc(max(env(safe-area-inset-bottom, 0px), 36px) + 12px + 56px + 8px)';

function useKeyboardGap(): number {
  const [gap, setGap] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const next = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setGap(next);
    };

    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    sync();

    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, []);

  return gap;
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  placeholder: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  maxLength?: number;
};

/** Fixed bottom text field — triggers the native mobile keyboard instead of bubble input. */
export function MobileChatInputBar({
  value,
  onChange,
  onSend,
  onClose,
  placeholder,
  inputRef,
  maxLength = 120,
}: Props) {
  const keyboardGap = useKeyboardGap();

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [inputRef]);

  const trySend = () => {
    if (value.trim()) onSend();
  };

  return (
    <div
      data-paraloid-ui
      className="mobile-chat-input-bar"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: keyboardGap > 0 ? keyboardGap : IDLE_BOTTOM,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
        background: 'rgba(18, 18, 22, 0.94)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        aria-label="Close chat"
        onClick={onClose}
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          border: 'none',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.65)',
          fontSize: 16,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        ✕
      </button>

      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        enterKeyHint="send"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            trySend();
          }
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        autoCorrect="on"
        spellCheck
        style={{
          flex: 1,
          minWidth: 0,
          height: 40,
          border: 'none',
          borderRadius: 10,
          padding: '0 12px',
          fontSize: 16,
          fontFamily: 'inherit',
          background: 'rgba(255,255,255,0.95)',
          color: '#1a1a1a',
          outline: 'none',
        }}
      />

      <button
        type="button"
        aria-label="Send message"
        disabled={!value.trim()}
        onClick={trySend}
        style={{
          flexShrink: 0,
          height: 40,
          padding: '0 14px',
          border: 'none',
          borderRadius: 10,
          background: value.trim() ? 'rgba(99, 179, 237, 0.9)' : 'rgba(255,255,255,0.12)',
          color: value.trim() ? '#0d1b2a' : 'rgba(255,255,255,0.35)',
          fontSize: 14,
          fontWeight: 600,
          cursor: value.trim() ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Send
      </button>
    </div>
  );
}
