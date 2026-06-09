'use client';

import { DPadBtn } from './DPadBtn';

const MOBILE_BTN = {
  width: 64,
  height: 64,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,.22)',
  background: 'rgba(0,0,0,.42)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  color: 'rgba(255,255,255,.65)',
  fontSize: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none' as const,
  touchAction: 'none' as const,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

type Props = {
  muted: boolean;
  onToggleMute: () => void;
  onLeftStart: () => void;
  onLeftEnd: () => void;
  onRightStart: () => void;
  onRightEnd: () => void;
  onJump: () => void;
};

/** Thumb-zone D-pad (left) + mute (right), safe-area aware. */
export function MobileGameControls({
  muted,
  onToggleMute,
  onLeftStart,
  onLeftEnd,
  onRightStart,
  onRightEnd,
  onJump,
}: Props) {
  return (
    <>
      <style>{`
        .mobile-controls-dpad {
          position: absolute;
          left: max(12px, calc(env(safe-area-inset-left, 0px) + 8px));
          bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 8px));
          z-index: 45;
          display: flex;
          gap: 10px;
          align-items: center;
          pointer-events: auto;
        }
        .mobile-controls-mute {
          position: absolute;
          right: max(12px, calc(env(safe-area-inset-right, 0px) + 8px));
          bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 8px));
          z-index: 45;
          pointer-events: auto;
        }
      `}</style>

      <div data-paraloid-ui className="mobile-controls-dpad md:hidden">
        <DPadBtn label="←" onStart={onLeftStart} onEnd={onLeftEnd} />
        <DPadBtn label="↑" onStart={onJump} onEnd={() => {}} />
        <DPadBtn label="→" onStart={onRightStart} onEnd={onRightEnd} />
      </div>

      <button
        type="button"
        className="mobile-controls-mute md:hidden"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onPointerDown={e => e.preventDefault()}
        onClick={onToggleMute}
        style={{
          ...MOBILE_BTN,
          color: muted ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.65)',
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </>
  );
}
