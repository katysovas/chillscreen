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
  onOpenAmbientChat?: () => void;
  ambientChatOpen?: boolean;
};

function StageSwapIcon({ size = 24 }: { size?: number }) {
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

function ChatIcon({ size = 24 }: { size?: number }) {
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
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-3.5 3v-3H7.5A2.5 2.5 0 0 1 5 12.5v-6Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const mobileActionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  onOpenAmbientChat,
  ambientChatOpen = false,
}: Props) {
  const showCart = Boolean(onToggleVendorShop);
  const showStageSwap = Boolean(onOpenStageSwap);
  const showChat = Boolean(onOpenAmbientChat);

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
            z-index: 45;
            gap: 8px;
            align-items: center;
            pointer-events: auto;
          }
          .mobile-controls-tray {
            display: flex;
            position: absolute;
            right: max(12px, calc(env(safe-area-inset-right, 0px) + 8px));
            z-index: 45;
            gap: 8px;
            align-items: center;
            pointer-events: auto;
            max-width: calc(100vw - 24px);
            flex-wrap: nowrap;
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
        {showChat && (
          <button
            type="button"
            className="mobile-controls-chat mobile-controls-action-btn"
            aria-label={ambientChatOpen ? 'Close shout chat' : 'Shout to the crowd'}
            aria-pressed={ambientChatOpen}
            title={ambientChatOpen ? 'Close shout' : 'Shout'}
            onPointerDown={e => e.preventDefault()}
            onClick={onOpenAmbientChat}
            style={{
              ...mobileActionBtn,
              background: ambientChatOpen ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.42)',
              color: ambientChatOpen ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.78)',
            }}
          >
            <ChatIcon />
          </button>
        )}

        {showStageSwap && (
          <button
            type="button"
            className="mobile-controls-stage-swap mobile-controls-action-btn"
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
            className="mobile-controls-cart mobile-controls-action-btn"
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
            <ShoppingCartIcon size={22} />
          </button>
        )}

        <button
          type="button"
          className="mobile-controls-mute mobile-controls-action-btn"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onPointerDown={e => e.preventDefault()}
          onClick={onToggleMute}
          style={{
            ...mobileActionBtn,
            fontSize: 22,
            color: muted ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.65)',
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </>
  );
}
