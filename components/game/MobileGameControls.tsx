'use client';

import { ShoppingCartIcon } from './BottomControlPanel';
import { DPadBtn } from './DPadBtn';

type Props = {
  muted: boolean;
  onToggleMute: () => void;
  onLeftStart: () => void;
  onLeftEnd: () => void;
  onRightStart: () => void;
  onRightEnd: () => void;
  onJump: () => void;
  /** Hide D-pad — mobile lounge mode (mute only). */
  loungeMode?: boolean;
  vendorShopOpen?: boolean;
  onToggleVendorShop?: () => void;
  onVendorShopWarm?: () => void;
  onOpenStageSwap?: () => void;
};

function StageSwapIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path
        d="M4 18V8.5A1.5 1.5 0 0 1 5.5 7H14"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M8 4.5 4 8l4 3.5"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 6v9.5A1.5 1.5 0 0 1 18.5 17H10"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="m16 19.5 4-3.5-4-3.5"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const mobileActionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 64,
  height: 64,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,.22)',
  background: 'rgba(0,0,0,.42)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  userSelect: 'none',
  touchAction: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  pointerEvents: 'auto',
  padding: 0,
};

/** Thumb-zone D-pad (left) + shop + mute (right), safe-area aware — mobile only. */
export function MobileGameControls({
  muted,
  onToggleMute,
  onLeftStart,
  onLeftEnd,
  onRightStart,
  onRightEnd,
  onJump,
  loungeMode = false,
  vendorShopOpen = false,
  onToggleVendorShop,
  onVendorShopWarm,
  onOpenStageSwap,
}: Props) {
  const showCart = Boolean(onToggleVendorShop);
  const showStageSwap = Boolean(onOpenStageSwap);

  return (
    <>
      <style>{`
        .mobile-controls-dpad,
        .mobile-controls-tray {
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
          .mobile-controls-tray {
            display: flex;
            position: absolute;
            right: max(12px, calc(env(safe-area-inset-right, 0px) + 8px));
            bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 8px));
            z-index: 45;
            gap: 10px;
            align-items: center;
            pointer-events: auto;
          }
        }
      `}</style>

      <div
        data-paraloid-ui
        className="mobile-controls-dpad"
        style={loungeMode ? { display: 'none' } : undefined}
      >
        <DPadBtn label="←" onStart={onLeftStart} onEnd={onLeftEnd} />
        <DPadBtn label="↑" onStart={onJump} onEnd={() => {}} />
        <DPadBtn label="→" onStart={onRightStart} onEnd={onRightEnd} />
      </div>

      <div data-paraloid-ui className="mobile-controls-tray">
        {showStageSwap && (
          <button
            type="button"
            className="mobile-controls-stage-swap"
            aria-label="Change stage"
            title="Change stage"
            onPointerDown={e => e.preventDefault()}
            onClick={onOpenStageSwap}
            style={{
              ...mobileActionBtn,
              color: 'rgba(255,255,255,.78)',
            }}
          >
            <StageSwapIcon />
          </button>
        )}

        {showCart && (
          <button
            type="button"
            className="mobile-controls-cart"
            aria-label={vendorShopOpen ? 'Close festival store' : 'Open festival store'}
            aria-pressed={vendorShopOpen}
            title={vendorShopOpen ? 'Close store' : 'Festival store'}
            onPointerDown={e => e.preventDefault()}
            onClick={() => {
              onVendorShopWarm?.();
              onToggleVendorShop?.();
            }}
            style={{
              ...mobileActionBtn,
              background: vendorShopOpen ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.42)',
              color: vendorShopOpen ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.78)',
            }}
          >
            <ShoppingCartIcon size={26} />
          </button>
        )}

        <button
          type="button"
          className="mobile-controls-mute"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onPointerDown={e => e.preventDefault()}
          onClick={onToggleMute}
          style={{
            ...mobileActionBtn,
            fontSize: 24,
            color: muted ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.65)',
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </>
  );
}
