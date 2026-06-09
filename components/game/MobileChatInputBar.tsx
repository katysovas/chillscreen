'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { trackMobileControl } from '@/lib/gameInputAnalytics';

const IDLE_BOTTOM =
  'calc(max(env(safe-area-inset-bottom, 0px), 36px) + 12px + 56px + 8px)';

/** Keyboard visible once the viewport shrinks by at least this much. */
const KEYBOARD_THRESHOLD_PX = 60;

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
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [inputRef]);

  // Position via DOM ref — avoids React re-renders when the keyboard jitters.
  useLayoutEffect(() => {
    const bar = barRef.current;
    const vv = window.visualViewport;
    if (!bar || !vv) return;

    let lockedGap: number | null = null;

    const applyBottom = () => {
      if (lockedGap !== null) {
        bar.style.bottom = `${lockedGap}px`;
      } else {
        bar.style.bottom = IDLE_BOTTOM;
      }
    };

    const sync = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const focused = document.activeElement === inputRef.current;

      if (focused && gap >= KEYBOARD_THRESHOLD_PX) {
        lockedGap = Math.max(lockedGap ?? 0, gap);
      } else if (!focused) {
        lockedGap = null;
      }

      applyBottom();
    };

    const onBlur = () => {
      lockedGap = null;
      applyBottom();
    };

    const input = inputRef.current;

    vv.addEventListener('resize', sync);
    input?.addEventListener('blur', onBlur);
    sync();

    return () => {
      vv.removeEventListener('resize', sync);
      input?.removeEventListener('blur', onBlur);
    };
  }, [inputRef]);

  const trySend = () => {
    if (!value.trim()) return;
    trackMobileControl('Enter');
    onSend();
  };

  const canSend = value.trim().length > 0;

  return (
    <div
      ref={barRef}
      data-paraloid-ui
      className="mobile-chat-input-bar"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: IDLE_BOTTOM,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
        background: 'rgba(18, 18, 22, 0.94)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
        pointerEvents: 'auto',
        transform: 'translateZ(0)',
        willChange: 'bottom',
      }}
    >
      <button
        type="button"
        aria-label="Close chat"
        onClick={() => {
          trackMobileControl('Escape');
          onClose();
        }}
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
        disabled={!canSend}
        onClick={trySend}
        style={{
          flexShrink: 0,
          height: 40,
          minWidth: 58,
          padding: '0 14px',
          border: 'none',
          borderRadius: 10,
          background: canSend ? 'rgba(99, 179, 237, 0.9)' : 'rgba(255,255,255,0.12)',
          color: canSend ? '#0d1b2a' : 'rgba(255,255,255,0.35)',
          fontSize: 14,
          fontWeight: 600,
          cursor: canSend ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Send
      </button>
    </div>
  );
}
