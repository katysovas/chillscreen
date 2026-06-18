'use client';

import { useEffect, useMemo, useState } from 'react';
import { CreatorStageScenePanel } from '@/components/create/CreatorStageScenePanel';
import { fetchFestie, updateFestie, updatePassword } from '@/lib/festie/client';
import { CreatorStageProvider, useCreatorStageControls } from '@/lib/stages/CreatorStageContext';
import type { UserStagePublic } from '@/lib/stages/types';
import { FestieLifeHeader } from './FestieLifeHeader';
import type { FestieOwner } from '@/lib/festie/types';
import { Z_MODAL_NESTED } from '@/lib/zLayers';
import {
  isValidFestiePassword,
  validateFestiePassword,
  validatePersonalityNotes,
} from '@/lib/festie/validation';
import { getPlayerSession } from '@/lib/player/session';
import { getPlayerName } from '@/lib/playerStorage';
import { HelpFaqContent } from './HelpFaqContent';

export type FestieSettingsTab = 'customize' | 'stage' | 'access' | 'help' | 'contact';

function TabIconCustomize({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'block' }}>
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L7 17v3Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="m13.5 6.5 3 3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function TabIconAccess({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'block' }}>
      <rect
        x={5}
        y={11}
        width={14}
        height={10}
        rx={2}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={12} cy={16} r={1.25} fill="currentColor" />
    </svg>
  );
}

function TabIconContact({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'block' }}>
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5v-9Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabIconStage({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'block' }}>
      <path d="M4 7h16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={9} cy={7} r={2} stroke="currentColor" strokeWidth={1.5} />
      <path d="M4 12h16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={15} cy={12} r={2} stroke="currentColor" strokeWidth={1.5} />
      <path d="M4 17h16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={11} cy={17} r={2} stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function TabIconHelp({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'block' }}>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M9.5 9.25a2.75 2.75 0 0 1 5.1 1.35c0 1.65-1.35 2.15-2.1 2.65-.55.38-.9.72-.9 1.35v.1"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={12} cy={17.25} r={1} fill="currentColor" />
    </svg>
  );
}

const TAB_ICONS: Record<FestieSettingsTab, typeof TabIconCustomize> = {
  customize: TabIconCustomize,
  stage: TabIconStage,
  access: TabIconAccess,
  help: TabIconHelp,
  contact: TabIconContact,
};

type Props = {
  onClose: () => void;
  onUpdated?: (festie: FestieOwner) => void;
  ownerOnline?: boolean;
  refillFrom?: number | null;
  initialTab?: FestieSettingsTab;
  /** Signed-in viewer's creator stage, when they have one. */
  ownedStage?: UserStagePublic | null;
};

function FestieStageSettingsSection({ ownedStage }: { ownedStage: UserStagePublic }) {
  const creatorCtx = useCreatorStageControls();
  if (creatorCtx?.isOwner) {
    return <CreatorStageScenePanel />;
  }

  const session = getPlayerSession();
  if (!session.authenticated || session.userId !== ownedStage.ownerId) {
    return null;
  }

  return (
    <CreatorStageProvider
      initialStage={ownedStage}
      ownerUserId={ownedStage.ownerId}
      currentUserId={session.userId}
      authenticated={session.authenticated}
      sessionReady={session.hydrated}
    >
      <CreatorStageScenePanel />
    </CreatorStageProvider>
  );
}

const BASE_TABS: { id: FestieSettingsTab; label: string }[] = [
  { id: 'customize', label: 'Customize' },
  { id: 'stage', label: 'Stage' },
  { id: 'access', label: 'Access' },
  { id: 'help', label: 'Help' },
  { id: 'contact', label: 'Contact' },
];

function visibleSettingsTabs(ownedStage: UserStagePublic | null | undefined) {
  return BASE_TABS.filter(t => t.id !== 'stage' || Boolean(ownedStage));
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'rgba(255,255,255,0.55)',
  fontFamily: 'system-ui,sans-serif',
  fontWeight: 600,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  marginBottom: 8,
};

const INPUT: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 14,
  color: '#fff',
  outline: 'none',
  fontFamily: 'system-ui,sans-serif',
};

const BTN: React.CSSProperties = {
  border: 'none',
  borderRadius: 10,
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'system-ui,sans-serif',
};

/** Festie settings — tabbed: customize, access, help, contact. */
export function FestieSettingsModal({
  onClose,
  onUpdated,
  ownerOnline = true,
  refillFrom = null,
  initialTab = 'customize',
  ownedStage = null,
}: Props) {
  const tabs = useMemo(() => visibleSettingsTabs(ownedStage), [ownedStage]);
  const [tab, setTab] = useState<FestieSettingsTab>(() => {
    if (initialTab === 'stage' && !ownedStage) return 'customize';
    return tabs.some(t => t.id === initialTab) ? initialTab : 'customize';
  });
  const [loading, setLoading] = useState(true);
  const [festie, setFestie] = useState<FestieOwner | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingFestie, setSavingFestie] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [festieError, setFestieError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [contactEmail, setContactEmail] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [contactError, setContactError] = useState('');
  useEffect(() => {
    const next = initialTab === 'stage' && !ownedStage
      ? 'customize'
      : initialTab;
    setTab(next);
  }, [initialTab, ownedStage]);

  useEffect(() => {
    if (tab === 'stage' && !ownedStage) setTab('customize');
  }, [tab, ownedStage]);

  useEffect(() => {
    void (async () => {
      try {
        const row = await fetchFestie();
        if (!row) {
          setLoadError('Sign in to customize your festie.');
          return;
        }
        setFestie(row);
        setNotes(row.personality_notes ?? '');
      } catch {
        setLoadError('Could not load festie settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveFestie = async () => {
    setSavingFestie(true);
    setFestieError(null);
    const notesErr = validatePersonalityNotes(notes);
    if (notesErr) {
      setFestieError(notesErr);
      setSavingFestie(false);
      return;
    }
    try {
      const updated = await updateFestie({
        personality_notes: notes.trim() || null,
      });
      setFestie(updated);
      onUpdated?.(updated);
    } catch (err) {
      setFestieError(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setSavingFestie(false);
    }
  };

  const savePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    const pwErr = validateFestiePassword(newPassword);
    if (pwErr) {
      setPasswordError(pwErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (!currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('sending');
    setContactError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: festie?.name ?? getPlayerName() ?? 'Festie',
          email: contactEmail,
          notes: contactNotes,
        }),
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
  };

  const canSavePassword = isValidFestiePassword(newPassword)
    && newPassword === confirmPassword
    && currentPassword.length > 0;

  const needsFestie = tab === 'customize' || tab === 'access';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_MODAL_NESTED,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '24px 16px',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="festie-settings-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(94vw, 620px)',
          maxHeight: 'min(88vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          background: '#131415',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
          fontFamily: "Georgia,'Times New Roman',serif",
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
          padding: '18px 20px 12px',
          flexShrink: 0,
        }}>
          {festie ? (
            <FestieLifeHeader
              festie={festie}
              ownerOnline={ownerOnline}
              refillFrom={refillFrom}
              titleId="festie-settings-title"
              showLifeBar
            />
          ) : (
            <h2
              id="festie-settings-title"
              style={{
                margin: 0,
                fontSize: 20,
                color: '#fff',
                fontFamily: 'system-ui,sans-serif',
                fontWeight: 600,
              }}
            >
              Settings
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              padding: 4,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Settings sections"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
            gap: 3,
            margin: '0 16px 12px',
            padding: 3,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          {tabs.map(t => {
            const Icon = TAB_ICONS[t.id];
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={t.label}
                title={t.label}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '8px 2px',
                  minWidth: 0,
                  borderRadius: 9,
                  border: 'none',
                  fontSize: 10,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: 0.15,
                  fontFamily: 'system-ui,sans-serif',
                  background: active ? 'rgba(230,126,34,0.25)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
              >
                <Icon size={15} />
                <span style={{ lineHeight: 1.1, textAlign: 'center' }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 20px 20px',
        }}>
          {loading && needsFestie && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui,sans-serif', fontSize: 14 }}>
              Loading…
            </p>
          )}

          {needsFestie && !loading && !festie && (
            <p style={{ color: '#ff9d9d', fontFamily: 'system-ui,sans-serif', fontSize: 14 }}>
              {loadError ?? 'Sign in to customize your festie.'}
            </p>
          )}

          {tab === 'customize' && festie && (
            <>
              <span style={LABEL}>Describe {festie.name}</span>
              <p style={{
                margin: '0 0 10px',
                fontSize: 12,
                color: 'rgba(255,255,255,0.45)',
                fontFamily: 'system-ui,sans-serif',
                lineHeight: 1.45,
              }}
              >
                Used for conversations when you sign off.
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value.slice(0, 280))}
                placeholder="e.g. Loves deep house, always hyping the crowd, terrible at small talk."
                rows={4}
                style={{ ...INPUT, resize: 'vertical', marginBottom: 14 }}
              />

              {festieError && (
                <p style={{ color: '#ff9d9d', fontSize: 13, margin: '0 0 10px', fontFamily: 'system-ui,sans-serif' }}>
                  {festieError}
                </p>
              )}
              <button
                type="button"
                disabled={savingFestie}
                onClick={() => void saveFestie()}
                style={{
                  ...BTN,
                  width: '100%',
                  background: savingFestie
                    ? 'rgba(255,255,255,0.08)'
                    : 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)',
                  color: '#fff',
                  cursor: savingFestie ? 'default' : 'pointer',
                }}
              >
                {savingFestie ? 'Saving…' : 'Save'}
              </button>
            </>
          )}

          {tab === 'stage' && ownedStage && (
            <FestieStageSettingsSection ownedStage={ownedStage} />
          )}

          {tab === 'access' && !loading && !festie && (
            <p style={{ color: '#ff9d9d', fontFamily: 'system-ui,sans-serif', fontSize: 14 }}>
              {loadError ?? 'Sign in to manage access.'}
            </p>
          )}

          {tab === 'access' && festie && (
            <>
              <span style={LABEL}>Change password</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  autoComplete="current-password"
                  style={INPUT}
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password (6–64 chars)"
                  autoComplete="new-password"
                  style={INPUT}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  style={INPUT}
                />
              </div>
              {passwordError && (
                <p style={{ color: '#ff9d9d', fontSize: 13, margin: '0 0 8px', fontFamily: 'system-ui,sans-serif' }}>
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p style={{ color: '#8fd49a', fontSize: 13, margin: '0 0 8px', fontFamily: 'system-ui,sans-serif' }}>
                  Password updated.
                </p>
              )}
              <button
                type="button"
                disabled={!canSavePassword || savingPassword}
                onClick={() => void savePassword()}
                style={{
                  ...BTN,
                  width: '100%',
                  background: canSavePassword && !savingPassword
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255,255,255,0.06)',
                  color: canSavePassword && !savingPassword ? '#fff' : 'rgba(255,255,255,0.35)',
                  cursor: canSavePassword && !savingPassword ? 'pointer' : 'default',
                }}
              >
                {savingPassword ? 'Updating…' : 'Update password'}
              </button>
            </>
          )}

          {tab === 'help' && (
            <>
              <HelpFaqContent />
            </>
          )}

          {tab === 'contact' && (
            <>
              <p style={{
                margin: '0 0 16px',
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'system-ui,sans-serif',
                lineHeight: 1.5,
              }}>
                We'd love to hear from you.
              </p>
              {contactStatus === 'sent' ? (
                <div style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontFamily: 'system-ui,sans-serif',
                  textAlign: 'center',
                  padding: '20px 0',
                }}>
                  Message sent! We'll be in touch.
                </div>
              ) : (
                <form onSubmit={e => void handleContactSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <span style={LABEL}>Email</span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      style={INPUT}
                    />
                  </div>
                  <div>
                    <span style={LABEL}>Notes</span>
                    <textarea
                      value={contactNotes}
                      onChange={e => setContactNotes(e.target.value)}
                      placeholder="How would you like to contribute?"
                      required
                      rows={4}
                      style={{ ...INPUT, resize: 'vertical' }}
                    />
                  </div>
                  {contactError && (
                    <p style={{ color: '#ff9d9d', fontSize: 13, fontFamily: 'system-ui,sans-serif', margin: 0 }}>
                      {contactError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={contactStatus === 'sending'}
                    style={{
                      ...BTN,
                      width: '100%',
                      background: contactStatus === 'sending'
                        ? 'rgba(255,255,255,0.06)'
                        : 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)',
                      color: contactStatus === 'sending' ? 'rgba(255,255,255,0.4)' : '#fff',
                      cursor: contactStatus === 'sending' ? 'default' : 'pointer',
                    }}
                  >
                    {contactStatus === 'sending' ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
