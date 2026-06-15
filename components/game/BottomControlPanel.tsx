'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  activeVenueRoute,
  buildInviteUrl,
  inviteLinkLabel,
} from '@/lib/inviteLink';
import type { VenueRoute } from '@/lib/venueRoutes';

type BottomControlPanelProps = {
  worldOff: number;
  playerName: string | null;
  venueRoute?: VenueRoute;
  connectName?: string | null;
  /** Tap-to-connect on mobile (replaces ↵ keyboard hint). */
  onConnectTap?: () => void;
  hidden?: boolean;
  onCapturePhoto?: () => void | Promise<void>;
  vendorShopOpen?: boolean;
  onToggleVendorShop?: () => void;
  onVendorShopWarm?: () => void;
  /** Opens the city / stage picker (desktop + in-game). */
  onOpenCityPicker?: () => void;
  /** Hides invite + cart — those move to MobileGameControls on phone. */
  isMobile?: boolean;
};

const hintText: React.CSSProperties = {
  color: 'rgba(255,255,255,.55)',
  fontSize: 10,
  letterSpacing: 1.8,
  textTransform: 'uppercase',
  fontFamily: "Georgia,'Times New Roman',serif",
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
};

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'rgba(255,255,255,.65)',
  fontSize: 10,
  letterSpacing: 1.8,
  textTransform: 'uppercase',
  fontFamily: "Georgia,'Times New Roman',serif",
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const panelDivider: React.CSSProperties = {
  width: 1,
  alignSelf: 'stretch',
  background: 'rgba(255,255,255,.1)',
  flexShrink: 0,
};

/** Re-enable when paraloid capture is ready. */
const PARALOID_CAPTURE_ENABLED = false;

function CameraIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      {/* flat body */}
      <rect x={3} y={7} width={18} height={13} rx={2} stroke="currentColor" strokeWidth={1.5} />
      {/* viewfinder housing */}
      <path
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* eyepiece slot */}
      <rect x={10.2} y={4.8} width={3.6} height={1.4} rx={0.35} fill="currentColor" />
      {/* flash */}
      <rect x={5} y={9.2} width={2.8} height={2} rx={0.45} stroke="currentColor" strokeWidth={1.25} />
      {/* lens ring */}
      <circle cx={12} cy={13.5} r={4.1} stroke="currentColor" strokeWidth={1.5} />
      {/* lens glass — flat filled disc */}
      <circle cx={12} cy={13.5} r={2.3} fill="currentColor" />
    </svg>
  );
}

export function StageSwapIcon({ size = 18 }: { size?: number }) {
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
        d="M20 7H4m4-4L4 7l4 4"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17h16m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SignOutIcon({ size = 18 }: { size?: number }) {
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
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon({ size = 18 }: { size?: number }) {
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
        d="M12 20.5s-6.5-4.2-8.8-7.4C1.4 10.2 2.2 6.5 5.4 5.2c2.1-.9 4.3.2 5.4 2 1.1-1.8 3.3-2.9 5.4-2 3.2 1.3 4 5 2.2 8.1C18.5 16.3 12 20.5 12 20.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsIcon({ size = 18 }: { size?: number }) {
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
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M19.4 13.2a7.4 7.4 0 0 0 .1-2.4l2-1.5-2-3.5-2.4 1a7.6 7.6 0 0 0-2.1-1.2l-.4-2.6H9.4l-.4 2.6a7.6 7.6 0 0 0-2.1 1.2l-2.4-1-2 3.5 2 1.5a7.4 7.4 0 0 0 .1 2.4l-2 1.5 2 3.5 2.4-1a7.6 7.6 0 0 0 2.1 1.2l.4 2.6h5.2l.4-2.6a7.6 7.6 0 0 0 2.1-1.2l2.4 1 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShoppingCartIcon({ size = 18 }: { size?: number }) {
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
        d="M4 5h1.2l1.4 9.2a1.5 1.5 0 0 0 1.48 1.3h8.76a1.5 1.5 0 0 0 1.48-1.3L19.8 7H7.2"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={10} cy={19.5} r={1.25} fill="currentColor" />
      <circle cx={16.5} cy={19.5} r={1.25} fill="currentColor" />
    </svg>
  );
}

/** Bottom-center panel — vendor cart, paraloid capture, invite, connect hints. */
export function BottomControlPanel({
  worldOff,
  playerName,
  venueRoute,
  connectName = null,
  onConnectTap,
  hidden = false,
  onCapturePhoto,
  vendorShopOpen = false,
  onToggleVendorShop,
  onVendorShopWarm,
  onOpenCityPicker,
  isMobile = false,
}: BottomControlPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const route = useMemo(
    () => activeVenueRoute(worldOff, venueRoute),
    [worldOff, venueRoute],
  );

  const inviteUrl = useMemo(
    () => (route ? buildInviteUrl(route, playerName) : ''),
    [route, playerName],
  );

  const showInvite = Boolean(inviteUrl);
  const showConnect = Boolean(connectName?.trim()) && !isMobile;
  const showInviteBtn = !isMobile && showInvite && !showConnect;
  const hasMessages = showConnect || showInviteBtn;
  const showCart = Boolean(onToggleVendorShop) && !isMobile;
  const showCityPicker = Boolean(onOpenCityPicker) && !isMobile;

  const copyLink = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }, [inviteUrl]);

  const handleCapture = useCallback(async () => {
    if (!onCapturePhoto || capturing) return;
    setCapturing(true);
    try {
      await onCapturePhoto();
    } finally {
      setCapturing(false);
    }
  }, [capturing, onCapturePhoto]);

  useEffect(() => {
    setInviteOpen(false);
  }, [hidden, showConnect, route]);

  if (hidden || (!PARALOID_CAPTURE_ENABLED && !showCart && !hasMessages)) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      data-paraloid-ui
      className="bottom-[max(124px,calc(env(safe-area-inset-bottom)+112px))] md:bottom-5"
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 38,
        pointerEvents: 'auto',
        maxWidth: 'min(96vw, 560px)',
      }}
    >
      <div
        style={{
          borderRadius: 999,
          background: 'rgba(0,0,0,.36)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.1)',
          display: 'flex',
          alignItems: 'stretch',
          overflow: 'hidden',
        }}
      >
        {showCart && (
          <button
            type="button"
            onClick={() => {
              onVendorShopWarm?.();
              onToggleVendorShop?.();
            }}
            onMouseEnter={onVendorShopWarm}
            onFocus={onVendorShopWarm}
            aria-label={vendorShopOpen ? 'Close festival store' : 'Open festival store'}
            aria-pressed={vendorShopOpen}
            title={vendorShopOpen ? 'Close store' : 'Festival store'}
            style={{
              ...ghostBtn,
              padding: '8px 14px',
              background: vendorShopOpen ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)',
              color: vendorShopOpen ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.78)',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingCartIcon />
          </button>
        )}

        {showCart && showCityPicker && (
          <div style={panelDivider} aria-hidden />
        )}

        {showCityPicker && (
          <button
            type="button"
            onClick={onOpenCityPicker}
            aria-label="Change city"
            title="Change city"
            style={{
              ...ghostBtn,
              padding: '8px 14px',
              background: 'rgba(255,255,255,.06)',
              color: 'rgba(255,255,255,.78)',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StageSwapIcon />
          </button>
        )}

        {(showCart || showCityPicker) && (PARALOID_CAPTURE_ENABLED || hasMessages) && (
          <div style={panelDivider} aria-hidden />
        )}

        {PARALOID_CAPTURE_ENABLED && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={!onCapturePhoto || capturing}
            aria-label={capturing ? 'Capturing photo' : 'Capture photo'}
            aria-busy={capturing}
            title="Capture photo"
            style={{
              ...ghostBtn,
              padding: '8px 14px',
              background: 'rgba(255,255,255,.06)',
              color: capturing ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.78)',
              cursor: onCapturePhoto && !capturing ? 'pointer' : 'default',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CameraIcon />
          </button>
        )}

        {PARALOID_CAPTURE_ENABLED && hasMessages && (
          <div style={panelDivider} aria-hidden />
        )}

        {hasMessages && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'nowrap',
              padding: '7px 16px',
              minWidth: 0,
            }}
          >
              {showConnect && onConnectTap ? (
                <button
                  type="button"
                  onClick={onConnectTap}
                  style={{
                    ...ghostBtn,
                    color: 'rgba(255,255,255,.72)',
                    padding: '4px 2px',
                  }}
                >
                  Tap to connect with {connectName}
                </button>
              ) : showConnect ? (
                <span style={hintText}>↵ connect with {connectName}</span>
              ) : null}
              {showInviteBtn && (
                <button
                  type="button"
                  onClick={() => setInviteOpen(o => !o)}
                  aria-expanded={inviteOpen}
                  style={{
                    ...ghostBtn,
                    color: inviteOpen ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.65)',
                  }}
                >
                  Invite Friends
                </button>
              )}
              {inviteOpen && showInviteBtn && (
                <>
                  <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 10, userSelect: 'none' }}>·</span>
                  <span
                    style={{
                      maxWidth: 'min(42vw, 200px)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontStyle: 'normal',
                      fontSize: 10,
                      color: 'rgba(255,255,255,.5)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inviteLinkLabel(inviteUrl)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 10, userSelect: 'none' }}>·</span>
                  <button type="button" onClick={copyLink} style={ghostBtn}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </>
              )}
            </div>
        )}
      </div>
    </div>
  );
}
