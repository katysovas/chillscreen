'use client';

import { useState, type CSSProperties } from 'react';
import { requestPasswordReset } from '@/lib/festie/client';
import {
  isValidFestieName,
  sanitizeFestieNameInput,
  isValidNotifyEmail,
} from '@/lib/festie/validation';

const FIELD_LABEL: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.45)',
  fontFamily: 'system-ui,sans-serif',
};

const INPUT: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(0,0,0,0.35)',
  color: '#fff',
  fontFamily: 'system-ui,sans-serif',
  outline: 'none',
};

type Props = {
  initialName?: string;
  onBack: () => void;
};

/** Inline forgot-password step — shared by game welcome and /create wizard. */
export function ForgotPasswordPanel({ initialName = '', onBack }: Props) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = isValidFestieName(name) && isValidNotifyEmail(email) && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const message = await requestPasswordReset(name.trim(), email.trim());
      setSuccess(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <h2 style={{
          margin: '0 0 12px',
          fontSize: 20,
          fontWeight: 600,
          color: '#fff',
          textAlign: 'center',
          fontFamily: 'system-ui,sans-serif',
        }}
        >
          Check your email
        </h2>
        <p style={{
          margin: '0 0 20px',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.72)',
          textAlign: 'center',
          fontFamily: 'system-ui,sans-serif',
        }}
        >
          {success}
        </p>
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '100%',
            borderRadius: 12,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'system-ui,sans-serif',
          }}
        >
          Back to sign in
        </button>
      </>
    );
  }

  return (
    <>
      <h2 style={{
        margin: '0 0 8px',
        fontSize: 20,
        fontWeight: 600,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'system-ui,sans-serif',
      }}
      >
        Forgot password
      </h2>
      <p style={{
        margin: '0 0 16px',
        fontSize: 13,
        lineHeight: 1.45,
        color: 'rgba(255,255,255,0.55)',
        textAlign: 'center',
        fontFamily: 'system-ui,sans-serif',
      }}
      >
        Enter your festie name and the email saved in your account settings.
      </p>

      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={FIELD_LABEL}>Festie name</span>
        <input
          value={name}
          onChange={e => setName(sanitizeFestieNameInput(e.target.value))}
          placeholder="GrooveGoblin"
          autoComplete="username"
          autoFocus
          style={INPUT}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 16 }}>
        <span style={FIELD_LABEL}>Email</span>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value.slice(0, 254))}
          placeholder="you@example.com"
          autoComplete="email"
          onKeyDown={e => {
            if (e.key === 'Enter' && canSubmit) void submit();
          }}
          style={INPUT}
        />
      </label>

      {error && (
        <p style={{
          color: '#ff9d9d',
          fontSize: 13,
          margin: '0 0 12px',
          textAlign: 'center',
          fontFamily: 'system-ui,sans-serif',
        }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={!canSubmit}
        style={{
          width: '100%',
          borderRadius: 12,
          padding: '14px 20px',
          fontSize: 15,
          fontWeight: 600,
          border: 'none',
          background: canSubmit
            ? 'linear-gradient(180deg, #7eb8ff 0%, #4a8fd4 100%)'
            : 'rgba(255,255,255,0.1)',
          color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
          cursor: canSubmit ? 'pointer' : 'default',
          fontFamily: 'system-ui,sans-serif',
          marginBottom: 10,
        }}
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>

      <button
        type="button"
        onClick={onBack}
        style={{
          width: '100%',
          borderRadius: 12,
          padding: '12px 20px',
          fontSize: 14,
          fontWeight: 600,
          border: 'none',
          background: 'transparent',
          color: 'rgba(255,255,255,0.55)',
          cursor: 'pointer',
          fontFamily: 'system-ui,sans-serif',
        }}
      >
        Back to sign in
      </button>
    </>
  );
}
