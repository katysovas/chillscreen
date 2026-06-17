'use client';

import { useEffect, useState } from 'react';
import { updateFestie } from '@/lib/festie/client';
import { festiePresetById } from '@/lib/festie/presets';
import { isValidNotifyEmail } from '@/lib/festie/validation';
import type { FestieOwner } from '@/lib/festie/types';

const PANEL_INPUT: React.CSSProperties = {
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

type Props = {
  festie: FestieOwner;
  onUpdated?: (festie: FestieOwner) => void;
  inputId?: string;
};

export function festieNeedsNotifyEmail(festie: FestieOwner | null | undefined): boolean {
  return Boolean(festie && !festie.notify_email?.trim());
}

export function FestieNotifyEmailSignup({
  festie,
  onUpdated,
  inputId = 'festie-notify-email',
}: Props) {
  const preset = festiePresetById(festie.preset);
  const [email, setEmail] = useState(festie.notify_email ?? '');
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(festie.notify_email ?? '');
  }, [festie.notify_email]);

  const saveEmailPrefs = async () => {
    const trimmed = email.trim();
    if (trimmed && !isValidNotifyEmail(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(null);
    setSaving(true);
    try {
      const updated = await updateFestie({
        notify_email: trimmed || null,
        email_opted_in: Boolean(trimmed),
      });
      onUpdated?.(updated);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif' }}>
      <label
        htmlFor={inputId}
        style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}
      >
        Get {festie.name}&apos;s festie roundup — chats, highlights & festival gossip
      </label>
      <input
        id={inputId}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={PANEL_INPUT}
        autoComplete="email"
      />
      {emailError && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#f87171' }}>{emailError}</p>
      )}
      <button
        type="button"
        disabled={saving}
        onClick={() => void saveEmailPrefs()}
        style={{
          marginTop: 12,
          width: '100%',
          border: 'none',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
          background: preset.balloonColor,
          color: '#fff',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Saving…' : 'Save email prefs'}
      </button>
    </div>
  );
}
