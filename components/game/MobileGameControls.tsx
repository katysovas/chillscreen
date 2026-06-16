'use client';

import Link from 'next/link';
import { trackMobileControl } from '@/lib/gameInputAnalytics';
import { LineupIcon, ShoppingCartIcon, StageSwapIcon } from './BottomControlPanel';

type Props = {
  muted: boolean;
  onToggleMute: () => void;
  vendorShopOpen?: boolean;
  onToggleVendorShop?: () => void;
  onVendorShopWarm?: () => void;
  onOpenStageSwap?: () => void;
  /** Stage owner only — opens tabbed stage settings modal. */
  showStageSettings?: boolean;
  onOpenStageSettings?: () => void;
  onOpenAmbientChat?: () => void;
  ambientChatOpen?: boolean;
  showMute?: boolean;
  showStageSwap?: boolean;
  showCreateStage?: boolean;
};

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

/** Action tray (chat, stage swap, cart, mute) — mobile only. */
export function MobileGameControls({
  muted,
  onToggleMute,
  vendorShopOpen = false,
  onToggleVendorShop,
  onVendorShopWarm,
  onOpenStageSwap,
  showStageSettings = false,
  onOpenStageSettings,
  onOpenAmbientChat,
  ambientChatOpen = false,
  showMute = true,
  showStageSwap: showStageSwapProp = true,
  showCreateStage = false,
}: Props) {
  const showCart = Boolean(onToggleVendorShop);
  const showStageSwap = showStageSwapProp && Boolean(onOpenStageSwap);
  const showStageSettingsBtn = showStageSettings && Boolean(onOpenStageSettings);
  const showChat = Boolean(onOpenAmbientChat);

  return (
    <>
      <style>{`
        .mobile-controls-tray {
          display: none;
          pointer-events: none;
        }
        @media (max-width: 767px) {
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

      <div data-paraloid-ui className="mobile-controls-tray">
        {showChat && (
          <button
            type="button"
            className="mobile-controls-chat mobile-controls-action-btn"
            aria-label={ambientChatOpen ? 'Close shout chat' : 'Shout to the crowd'}
            aria-pressed={ambientChatOpen}
            title={ambientChatOpen ? 'Close shout' : 'Shout'}
            onPointerDown={e => e.preventDefault()}
            onClick={() => {
              trackMobileControl(ambientChatOpen ? 'Escape' : 'Enter');
              onOpenAmbientChat?.();
            }}
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
            onClick={() => {
              trackMobileControl('stage_swap');
              onOpenStageSwap?.();
            }}
            style={{
              ...mobileActionBtn,
              color: 'rgba(255,255,255,.78)',
            }}
          >
            <StageSwapIcon size={24} />
          </button>
        )}

        {showStageSettingsBtn && (
          <button
            type="button"
            className="mobile-controls-stage-settings mobile-controls-action-btn"
            aria-label="Stage settings"
            title="Stage settings"
            onPointerDown={e => e.preventDefault()}
            onClick={() => {
              trackMobileControl('stage_settings');
              onOpenStageSettings?.();
            }}
            style={{
              ...mobileActionBtn,
              color: 'rgba(255,255,255,.78)',
            }}
          >
            <LineupIcon size={22} />
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
              trackMobileControl(vendorShopOpen ? 'cart_close' : 'cart_open');
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

        {showCreateStage && (
          <Link
            href="/create"
            className="mobile-controls-create-stage"
            style={{
              ...mobileActionBtn,
              width: 'auto',
              minHeight: 44,
              padding: '0 12px',
              borderRadius: 10,
              color: 'rgba(255,255,255,.82)',
              fontSize: 10,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              fontFamily: "Georgia,'Times New Roman',serif",
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Create Your Stage
          </Link>
        )}

        {showMute && (
          <button
            type="button"
            className="mobile-controls-mute mobile-controls-action-btn"
            aria-label={muted ? 'Unmute' : 'Mute'}
            onPointerDown={e => e.preventDefault()}
            onClick={() => {
              trackMobileControl(muted ? 'unmute' : 'mute');
              onToggleMute();
            }}
            style={{
              ...mobileActionBtn,
              fontSize: 22,
              color: muted ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.65)',
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        )}
      </div>
    </>
  );
}
