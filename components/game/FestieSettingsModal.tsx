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
import { DISCORD_URL } from '@/lib/site';
import { HelpFaqContent } from './HelpFaqContent';

export type FestieSettingsTab = 'customize' | 'stage' | 'access' | 'help';

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

function TabIconDiscord({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size * (96 / 127)} viewBox="0 0 127 96" aria-hidden style={{ display: 'block' }}>
      <path
        fill="currentColor"
        d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.41,75.41,0,0,0,75.37,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
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

/** Festie settings — tabbed: customize, access, help, plus Discord link. */
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
            gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))`,
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
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join us on Discord"
            title="Discord"
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
              fontWeight: 500,
              letterSpacing: 0.15,
              fontFamily: 'system-ui,sans-serif',
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <TabIconDiscord size={15} />
            <span style={{ lineHeight: 1.1, textAlign: 'center' }}>Discord</span>
          </a>
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
        </div>
      </div>
    </div>
  );
}
