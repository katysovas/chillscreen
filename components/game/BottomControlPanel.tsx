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

const FAQ_ITEMS: { q: string; a: string }[] = [
  { q: 'How do I move?', a: 'Arrow keys or A / D. Jump with W, ↑ or space.' },
  { q: 'How do I get more coins?', a: 'Keep an eye on the sidewalk — Ground Score!' },
  { q: 'How do I chat?', a: 'Press Enter to shout. Walk up to someone and press Enter to connect.' },
  { q: 'What are coins for?', a: 'Spend them at the festival store (cart icon) — hats, balloons, stickers.' },
  { q: 'Where\u2019s the music?', a: 'Walk to any stage. It plays when you\u2019re close.' },
];

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
  isMobile = false,
}: BottomControlPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [contactError, setContactError] = useState('');

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
  const showHelp = !isMobile;

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

  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('sending');
    setContactError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactName, email: contactEmail, notes: contactNotes }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setContactError(data.error ?? 'Something went wrong.');
        setContactStatus('error');
      } else {
        setContactStatus('sent');
      }
    } catch {
      setContactError('Network error. Please try again.');
      setContactStatus('error');
    }
  }, [contactName, contactEmail, contactNotes]);

  useEffect(() => {
    setInviteOpen(false);
  }, [hidden, showConnect, route]);

  useEffect(() => {
    if (!hidden) return;
    setHelpOpen(false);
    setContactOpen(false);
  }, [hidden]);

  useEffect(() => {
    if (!helpOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
        setContactOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHelpOpen(false);
        setContactOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [helpOpen]);

  if (hidden || (!PARALOID_CAPTURE_ENABLED && !showCart && !showHelp && !hasMessages)) return null;

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
      {helpOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(92vw, 340px)',
            borderRadius: 14,
            background: 'rgba(0,0,0,.55)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,.12)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {!contactOpen ? (
            <>
              {FAQ_ITEMS.map(({ q, a }) => (
                <div key={q}>
                  <div
                    style={{
                      color: 'rgba(255,255,255,.85)',
                      fontSize: 11,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                      fontFamily: "Georgia,'Times New Roman',serif",
                      marginBottom: 2,
                    }}
                  >
                    {q}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255,255,255,.55)',
                      fontSize: 12,
                      lineHeight: 1.45,
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {a}
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 10, marginTop: 2 }}>
                <button
                  type="button"
                  onClick={() => { setContactOpen(true); setContactStatus('idle'); setContactError(''); }}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.07)',
                    border: '1px solid rgba(255,255,255,.14)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: 'rgba(255,255,255,.75)',
                    fontSize: 11,
                    letterSpacing: 1.3,
                    textTransform: 'uppercase',
                    fontFamily: "Georgia,'Times New Roman',serif",
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Help building this world
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <button
                  type="button"
                  onClick={() => { setContactOpen(false); setContactStatus('idle'); }}
                  aria-label="Back to FAQ"
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
                  }}
                >
                  ←
                </button>
                <span style={{
                  color: 'rgba(255,255,255,.7)',
                  fontSize: 11,
                  letterSpacing: 1.3,
                  textTransform: 'uppercase',
                  fontFamily: "Georgia,'Times New Roman',serif",
                }}>
                  Get involved
                </span>
              </div>

              {contactStatus === 'sent' ? (
                <div style={{
                  color: 'rgba(255,255,255,.6)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  fontFamily: 'system-ui, sans-serif',
                  textAlign: 'center',
                  padding: '12px 0',
                }}>
                  ✓ Message sent! We'll be in touch.
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Name', value: contactName, setter: setContactName, type: 'text', placeholder: 'Your name' },
                    { label: 'Email', value: contactEmail, setter: setContactEmail, type: 'email', placeholder: 'your@email.com' },
                  ].map(({ label, value, setter, type, placeholder }) => (
                    <div key={label}>
                      <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: "Georgia,'Times New Roman',serif", marginBottom: 4 }}>{label}</div>
                      <input
                        type={type}
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder={placeholder}
                        required
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          background: 'rgba(255,255,255,.06)',
                          border: '1px solid rgba(255,255,255,.14)',
                          borderRadius: 7,
                          padding: '7px 10px',
                          color: 'rgba(255,255,255,.85)',
                          fontSize: 12,
                          fontFamily: 'system-ui, sans-serif',
                          outline: 'none',
                        }}
                      />
                    </div>
                  ))}
                  <div>
                    <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: "Georgia,'Times New Roman',serif", marginBottom: 4 }}>Notes</div>
                    <textarea
                      value={contactNotes}
                      onChange={e => setContactNotes(e.target.value)}
                      placeholder="How would you like to contribute?"
                      required
                      rows={3}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(255,255,255,.06)',
                        border: '1px solid rgba(255,255,255,.14)',
                        borderRadius: 7,
                        padding: '7px 10px',
                        color: 'rgba(255,255,255,.85)',
                        fontSize: 12,
                        fontFamily: 'system-ui, sans-serif',
                        outline: 'none',
                        resize: 'none',
                      }}
                    />
                  </div>
                  {contactError && (
                    <div style={{ color: '#ff7070', fontSize: 11, fontFamily: 'system-ui, sans-serif' }}>{contactError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={contactStatus === 'sending'}
                    style={{
                      background: contactStatus === 'sending' ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.12)',
                      border: '1px solid rgba(255,255,255,.2)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: contactStatus === 'sending' ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.85)',
                      fontSize: 11,
                      letterSpacing: 1.3,
                      textTransform: 'uppercase',
                      fontFamily: "Georgia,'Times New Roman',serif",
                      cursor: contactStatus === 'sending' ? 'default' : 'pointer',
                    }}
                  >
                    {contactStatus === 'sending' ? 'Sending…' : 'Send'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
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

        {showCart && showHelp && <div style={panelDivider} aria-hidden />}

        {showHelp && (
          <button
            type="button"
            onClick={() => setHelpOpen(o => !o)}
            aria-label={helpOpen ? 'Close help' : 'Open help'}
            aria-expanded={helpOpen}
            title="Help"
            style={{
              ...ghostBtn,
              padding: '8px 14px',
              background: helpOpen ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)',
              color: helpOpen ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.78)',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            ?
          </button>
        )}

        {showHelp && (PARALOID_CAPTURE_ENABLED || hasMessages) && (
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
