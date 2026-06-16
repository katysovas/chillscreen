'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { resetPasswordWithToken } from '@/lib/festie/client';
import { isValidFestiePassword } from '@/lib/festie/validation';
import { LOGO_PATH } from '@/lib/site';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordValid = isValidFestiePassword(password);
  const canSubmit = Boolean(token)
    && passwordValid
    && password === confirm
    && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await resetPasswordWithToken(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: '#111213',
      fontFamily: 'system-ui,sans-serif',
    }}
    >
      <div style={{
        width: '100%',
        maxWidth: 420,
        borderRadius: 16,
        padding: '28px 24px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_PATH}
          alt="WhichStage"
          style={{ display: 'block', height: 36, margin: '0 auto 20px' }}
        />

        {done ? (
          <>
            <h1 style={{ margin: '0 0 12px', fontSize: 22, color: '#fff', textAlign: 'center' }}>
              Password updated
            </h1>
            <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>
              Your new password is ready. Sign in with your festie name.
            </p>
            <Link
              href="/"
              style={{
                display: 'block',
                textAlign: 'center',
                borderRadius: 12,
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 600,
                background: 'linear-gradient(180deg, #7eb8ff 0%, #4a8fd4 100%)',
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              Go to WhichStage
            </Link>
            <Link
              href="/create"
              style={{
                display: 'block',
                marginTop: 12,
                textAlign: 'center',
                fontSize: 14,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Creator sign in
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: 22, color: '#fff', textAlign: 'center' }}>
              Choose a new password
            </h1>
            {!token && (
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#ff9d9d', textAlign: 'center' }}>
                This reset link is missing or invalid.
              </p>
            )}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                New password
              </span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value.slice(0, 64))}
                placeholder="6–64 characters"
                autoComplete="new-password"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 15,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                Confirm password
              </span>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value.slice(0, 64))}
                placeholder="Repeat password"
                autoComplete="new-password"
                onKeyDown={e => {
                  if (e.key === 'Enter' && canSubmit) void submit();
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 15,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                }}
              />
            </label>
            {password && confirm && password !== confirm && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#ff9d9d', textAlign: 'center' }}>
                Passwords do not match.
              </p>
            )}
            {error && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#ff9d9d', textAlign: 'center' }}>
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
              }}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
