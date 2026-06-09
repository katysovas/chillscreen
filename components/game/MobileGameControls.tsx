'use client';

import { DPadBtn } from './DPadBtn';

type Props = {
  muted: boolean;
  onToggleMute: () => void;
  onLeftStart: () => void;
  onLeftEnd: () => void;
  onRightStart: () => void;
  onRightEnd: () => void;
  onJump: () => void;
};

/** Thumb-zone D-pad (left) + mute (right), safe-area aware — mobile only. */
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
        .mobile-controls-dpad,
        .mobile-controls-mute {
          display: none;
          pointer-events: none;
        }
        @media (max-width: 767px) {
          .mobile-controls-dpad {
            display: flex;
            position: absolute;
            left: max(12px, calc(env(safe-area-inset-left, 0px) + 8px));
            bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 8px));
            z-index: 45;
            gap: 10px;
            align-items: center;
            pointer-events: auto;
          }
          .mobile-controls-mute {
            display: flex;
            position: absolute;
            right: max(12px, calc(env(safe-area-inset-right, 0px) + 8px));
            bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 8px));
            z-index: 45;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,.22);
            background: rgba(0,0,0,.42);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            font-size: 24px;
            user-select: none;
            touch-action: none;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            pointer-events: auto;
          }
        }
      `}</style>

      <div data-paraloid-ui className="mobile-controls-dpad">
        <DPadBtn label="←" onStart={onLeftStart} onEnd={onLeftEnd} />
        <DPadBtn label="↑" onStart={onJump} onEnd={() => {}} />
        <DPadBtn label="→" onStart={onRightStart} onEnd={onRightEnd} />
      </div>

      <button
        type="button"
        className="mobile-controls-mute"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onPointerDown={e => e.preventDefault()}
        onClick={onToggleMute}
        style={{
          color: muted ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.65)',
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </>
  );
}
