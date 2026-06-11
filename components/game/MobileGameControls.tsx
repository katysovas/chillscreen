'use client';

import { trackMobileControl } from '@/lib/gameInputAnalytics';
import { SettingsIcon, ShoppingCartIcon, StageSwapIcon } from './BottomControlPanel';

type Props = {
  muted: boolean;
  onToggleMute: () => void;
  vendorShopOpen?: boolean;
  onToggleVendorShop?: () => void;
  onVendorShopWarm?: () => void;
  settingsOpen?: boolean;
  onToggleSettings?: () => void;
  helpOpen?: boolean;
  onToggleHelp?: () => void;
  onOpenStageSwap?: () => void;
  onOpenAmbientChat?: () => void;
  ambientChatOpen?: boolean;
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
  settingsOpen = false,
  onToggleSettings,
  helpOpen = false,
  onToggleHelp,
  onOpenStageSwap,
  onOpenAmbientChat,
  ambientChatOpen = false,
}: Props) {
  const showSettings = Boolean(onToggleSettings);
  const showHelp = Boolean(onToggleHelp);
  const showCart = Boolean(onToggleVendorShop);
  const showStageSwap = Boolean(onOpenStageSwap);
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

        {showHelp && (
          <button
            type="button"
            className="mobile-controls-help mobile-controls-action-btn"
            aria-label={helpOpen ? 'Close help' : 'Open help'}
            aria-pressed={helpOpen}
            title="Help"
            onPointerDown={e => e.preventDefault()}
            onClick={() => {
              trackMobileControl(helpOpen ? 'help_close' : 'help_open');
              onToggleHelp?.();
            }}
            style={{
              ...mobileActionBtn,
              background: helpOpen ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.42)',
              color: helpOpen ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.78)',
              fontSize: 20,
              fontWeight: 700,
              fontFamily: 'system-ui,sans-serif',
            }}
          >
            ?
          </button>
        )}

        {showSettings && (
          <button
            type="button"
            className="mobile-controls-settings mobile-controls-action-btn"
            aria-label={settingsOpen ? 'Close festie settings' : 'Open festie settings'}
            aria-pressed={settingsOpen}
            title="Festie settings"
            onPointerDown={e => e.preventDefault()}
            onClick={() => {
              trackMobileControl(settingsOpen ? 'settings_close' : 'settings_open');
              onToggleSettings?.();
            }}
            style={{
              ...mobileActionBtn,
              background: settingsOpen ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.42)',
              color: settingsOpen ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.78)',
            }}
          >
            <SettingsIcon size={22} />
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
      </div>
    </>
  );
}
