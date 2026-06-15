'use client';

import { useEffect, useState } from 'react';
import { fetchFestie, updateFestie, updatePassword } from '@/lib/festie/client';
import {
  attributeToLevel,
  levelToAttribute,
  PERSONALITY_TRAITS,
  type PersonalityLevel,
  type PersonalityTraitKey,
} from '@/lib/festie/personalityLevels';
import {
  FESTIE_LLM_PROVIDER_OPTIONS,
  type FestieLlmProvider,
} from '@/lib/festie/llmProviders';
import { FESTIE_TOPIC_OPTIONS, FESTIE_TOPICS } from '@/lib/festie/presets';
import { FestieLifeHeader } from './FestieLifeHeader';
import type { FestieOwner } from '@/lib/festie/types';
import { Z_MODAL_NESTED } from '@/lib/zLayers';
import {
  isValidFestiePassword,
  validateFestiePassword,
} from '@/lib/festie/validation';
import { getPlayerName } from '@/lib/playerStorage';
import { HelpFaqContent } from './HelpFaqContent';
import { FestieHistoryPanel } from './FestieHistoryPanel';
import type { FestieSessionRecap } from '@/lib/festie/sessionRecap';

export type FestieSettingsTab = 'customize' | 'history' | 'access' | 'help' | 'contact';

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

function TabIconHistory({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'block' }}>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  history: TabIconHistory,
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
  sessionRecap?: FestieSessionRecap | null;
};

const TABS: { id: FestieSettingsTab; label: string }[] = [
  { id: 'customize', label: 'Customize' },
  { id: 'history', label: 'History' },
  { id: 'access', label: 'Access' },
  { id: 'help', label: 'Help' },
  { id: 'contact', label: 'Contact' },
];

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

function PersonalityPicker({
  traitKey,
  level,
  onChange,
}: {
  traitKey: PersonalityTraitKey;
  level: PersonalityLevel;
  onChange: (level: PersonalityLevel) => void;
}) {
  const trait = PERSONALITY_TRAITS.find(t => t.key === traitKey)!;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '72px 1fr',
      gap: 10,
      alignItems: 'center',
      marginBottom: 10,
    }}>
      <span style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'system-ui,sans-serif',
        fontWeight: 500,
      }}>
        {trait.label}
      </span>
      <div style={{
        display: 'flex',
        gap: 4,
        padding: 3,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {trait.options.map(opt => {
          const selected = level === opt.level;
          return (
            <button
              key={opt.level}
              type="button"
              title={opt.hint}
              onClick={() => onChange(opt.level)}
              style={{
                ...BTN,
                flex: 1,
                padding: '7px 4px',
                fontSize: 12,
                fontWeight: selected ? 600 : 500,
                borderRadius: 7,
                background: selected ? 'rgba(230,126,34,0.35)' : 'transparent',
                color: selected ? '#fff' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Festie settings — tabbed: customize, history, access, help, contact. */
export function FestieSettingsModal({
  onClose,
  onUpdated,
  ownerOnline = true,
  refillFrom = null,
  initialTab = 'customize',
  sessionRecap = null,
}: Props) {
  const [tab, setTab] = useState<FestieSettingsTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [festie, setFestie] = useState<FestieOwner | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [energyLevel, setEnergyLevel] = useState<PersonalityLevel>(2);
  const [friendlinessLevel, setFriendlinessLevel] = useState<PersonalityLevel>(2);
  const [chattinessLevel, setChattinessLevel] = useState<PersonalityLevel>(2);
  const [topics, setTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [llmProvider, setLlmProvider] = useState<FestieLlmProvider>('openai');

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
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    void (async () => {
      try {
        const row = await fetchFestie();
        if (!row) {
          setLoadError('Sign in to customize your festie.');
          return;
        }
        setFestie(row);
        setEnergyLevel(attributeToLevel(row.attributes.energy));
        setFriendlinessLevel(attributeToLevel(row.attributes.friendliness));
        setChattinessLevel(attributeToLevel(row.attributes.chattiness));
        setTopics(row.topics.filter(t => (FESTIE_TOPICS as readonly string[]).includes(t)));
        setNotes(row.personality_notes ?? '');
        setLlmProvider(row.llm_provider);
      } catch {
        setLoadError('Could not load festie settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleTopic = (topic: string) => {
    setTopics(prev => {
      if (prev.includes(topic)) return prev.filter(t => t !== topic);
      if (prev.length >= 3) return prev;
      return [...prev, topic];
    });
  };

  const saveFestie = async () => {
    setSavingFestie(true);
    setFestieError(null);
    try {
      const updated = await updateFestie({
        attributes: {
          energy: levelToAttribute(energyLevel),
          friendliness: levelToAttribute(friendlinessLevel),
          chattiness: levelToAttribute(chattinessLevel),
        },
        topics,
        personality_notes: notes.trim() || null,
        llm_provider: llmProvider,
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

  const needsFestie = tab === 'customize' || tab === 'access' || tab === 'history';

  const handleFestieUpdated = (updated: FestieOwner) => {
    setFestie(updated);
    onUpdated?.(updated);
  };

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
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: 3,
            margin: '0 16px 12px',
            padding: 3,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          {TABS.map(t => {
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
              <div style={{ marginBottom: 16 }}>
                <span style={{ ...LABEL, marginBottom: 10 }}>Personality</span>
                <PersonalityPicker traitKey="energy" level={energyLevel} onChange={setEnergyLevel} />
                <PersonalityPicker traitKey="friendliness" level={friendlinessLevel} onChange={setFriendlinessLevel} />
                <PersonalityPicker traitKey="chattiness" level={chattinessLevel} onChange={setChattinessLevel} />
              </div>

              <span style={LABEL}>AI model</span>
              <p style={{
                margin: '0 0 8px',
                fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                fontFamily: 'system-ui,sans-serif',
                lineHeight: 1.45,
              }}>
                Which LLM powers your festie when chatting with seeds on stage.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {FESTIE_LLM_PROVIDER_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLlmProvider(opt.id)}
                    style={{
                      ...BTN,
                      padding: '5px 10px',
                      fontSize: 12,
                      background: llmProvider === opt.id ? '#e67e22' : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <span style={LABEL}>Topics (up to 3)</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {FESTIE_TOPIC_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleTopic(id)}
                    style={{
                      ...BTN,
                      padding: '5px 10px',
                      fontSize: 12,
                      background: topics.includes(id) ? '#e67e22' : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <span style={LABEL}>Notes</span>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value.slice(0, 280))}
                placeholder="How should your festie act when you're away? (optional)"
                rows={3}
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
                {savingFestie ? 'Saving…' : 'Save festie settings'}
              </button>
            </>
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

          {tab === 'history' && festie && (
            <FestieHistoryPanel festie={festie} sessionRecap={sessionRecap} />
          )}

          {tab === 'history' && !loading && !festie && (
            <p style={{ color: '#ff9d9d', fontFamily: 'system-ui,sans-serif', fontSize: 14 }}>
              {loadError ?? 'Sign in to view history.'}
            </p>
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
                Help build this stage — we'd love to hear from you.
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
