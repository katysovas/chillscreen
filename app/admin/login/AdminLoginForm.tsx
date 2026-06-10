'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin/stage-playlists';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? 'Login failed');
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        width: '100%',
        maxWidth: 360,
        padding: 28,
        borderRadius: 12,
        background: '#1a1d27',
        border: '1px solid #2a2f3d',
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Admin login</h1>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: '#9aa0a6' }}>
        Enter the admin password to continue.
      </p>
      <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }} htmlFor="admin-password">
        Password
      </label>
      <input
        id="admin-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #3c4048',
          background: '#0f1117',
          color: '#e8eaed',
          marginBottom: 16,
        }}
      />
      {error ? (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#f28b82' }}>{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading || !password}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 8,
          border: 'none',
          background: loading ? '#4a5568' : '#5c7cfa',
          color: '#fff',
          fontWeight: 600,
          cursor: loading || !password ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
