'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminNav } from './AdminNav';
import type { AnonymousChatterRow, ChatAccountRow, ModerationBlock } from '@/lib/moderation/types';

type ModerationResponse = {
  accounts: ChatAccountRow[];
  anonymous: (AnonymousChatterRow & { blocked?: boolean })[];
  blocks: ModerationBlock[];
};

function fmtTs(ts: string | number | null | undefined): string {
  if (ts == null) return '—';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export function ChatModerationAdmin() {
  const [data, setData] = useState<ModerationResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [blockKind, setBlockKind] = useState<'display_name' | 'user_id' | 'ip'>('display_name');
  const [blockValue, setBlockValue] = useState('');
  const [blockNote, setBlockNote] = useState('');

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/chat-moderation');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      setData(body as ModerationResponse);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Load failed');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const postAction = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/chat-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      setStatus(body.purged != null ? `Done — purged ${body.purged} message(s).` : 'Done.');
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>
      <AdminNav active="chat" />
      <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>Chat moderation</h1>
      <p style={{ color: '#9aa0a6', margin: '0 0 24px', lineHeight: 1.5 }}>
        Festie accounts (signed-in) and anonymous stage chat display names. Blocking applies on
        PartyKit connect/chat within ~60s. IP blocks use Cloudflare headers when available.
      </p>

      {loadError && <p style={{ color: '#f28b82' }}>{loadError}</p>}
      {status && <p style={{ color: '#81c995' }}>{status}</p>}

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Manual block</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={blockKind}
            onChange={e => setBlockKind(e.target.value as typeof blockKind)}
            style={{ padding: '8px 10px', background: '#1a1d24', color: '#e8eaed', border: '1px solid #3c4043', borderRadius: 6 }}
          >
            <option value="display_name">Display name</option>
            <option value="user_id">User id</option>
            <option value="ip">IP address</option>
          </select>
          <input
            value={blockValue}
            onChange={e => setBlockValue(e.target.value)}
            placeholder={blockKind === 'ip' ? '203.0.113.10' : blockKind === 'user_id' ? 'uuid' : '123'}
            style={{ flex: '1 1 200px', minWidth: 180, padding: '8px 10px', background: '#1a1d24', color: '#e8eaed', border: '1px solid #3c4043', borderRadius: 6 }}
          />
          <input
            value={blockNote}
            onChange={e => setBlockNote(e.target.value)}
            placeholder="Note (optional)"
            style={{ flex: '1 1 160px', minWidth: 140, padding: '8px 10px', background: '#1a1d24', color: '#e8eaed', border: '1px solid #3c4043', borderRadius: 6 }}
          />
          <button
            type="button"
            disabled={busy || !blockValue.trim()}
            onClick={() => void postAction({
              action: 'block',
              kind: blockKind,
              value: blockValue,
              note: blockNote || undefined,
            })}
            style={{ padding: '8px 14px', background: '#8ab4f8', color: '#0f1117', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
          >
            Block + purge chatter
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Festie accounts</h2>
        <Table
          headers={['Festie', 'User id', 'Stage', '1:1 sessions', 'Last chat', '']}
          rows={(data?.accounts ?? []).map(row => [
            row.festie_name ?? '—',
            row.user_id,
            row.stage_slug ?? '—',
            String(row.conversation_sessions),
            fmtTs(row.last_chat_at),
            <RowActions
              key={row.user_id}
              busy={busy}
              blocked={row.blocked}
              onBlockDisplay={row.festie_name
                ? () => postAction({ action: 'block', kind: 'display_name', value: row.festie_name })
                : undefined}
              onBlockAccount={() => postAction({ action: 'block', kind: 'user_id', value: row.user_id })}
              onDelete={() => {
                if (!window.confirm(`Delete account ${row.festie_name ?? row.user_id}?`)) return;
                void postAction({ action: 'delete-account', userId: row.user_id });
              }}
              onPurge={row.festie_name
                ? () => postAction({ action: 'purge-chatter', displayName: row.festie_name })
                : undefined}
            />,
          ])}
        />
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Anonymous stage chat (2-day log)</h2>
        <Table
          headers={['Display name', 'Linked user id', 'Messages', 'Rooms', 'Last seen', '']}
          rows={(data?.anonymous ?? []).map(row => [
            row.display_name,
            row.user_id ?? '—',
            String(row.message_count),
            row.rooms.join(', '),
            fmtTs(row.last_ts),
            <RowActions
              key={`${row.sender}:${row.user_id ?? ''}`}
              busy={busy}
              blocked={row.blocked}
              onBlockDisplay={() => postAction({ action: 'block', kind: 'display_name', value: row.display_name })}
              onBlockAccount={row.user_id
                ? () => postAction({ action: 'block', kind: 'user_id', value: row.user_id })
                : undefined}
              onPurge={() => postAction({ action: 'purge-chatter', displayName: row.display_name })}
            />,
          ])}
        />
      </section>

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Active blocks</h2>
        <Table
          headers={['Kind', 'Value', 'Note', 'Created', '']}
          rows={(data?.blocks ?? []).map(row => [
            row.kind,
            row.value,
            row.note ?? '—',
            fmtTs(row.created_at),
            <button
              key={row.id}
              type="button"
              disabled={busy}
              onClick={() => void postAction({ action: 'unblock', id: row.id })}
              style={{ padding: '4px 10px', background: '#3c4043', color: '#e8eaed', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              Unblock
            </button>,
          ])}
        />
      </section>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) {
    return <p style={{ color: '#9aa0a6' }}>None.</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #3c4043', color: '#9aa0a6', fontWeight: 500 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '8px 10px', borderBottom: '1px solid #252830', verticalAlign: 'top', wordBreak: 'break-word' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({
  busy,
  blocked,
  onBlockDisplay,
  onBlockAccount,
  onDelete,
  onPurge,
}: {
  busy: boolean;
  blocked?: boolean;
  onBlockDisplay?: () => void;
  onBlockAccount?: () => void;
  onDelete?: () => void;
  onPurge?: () => void;
}) {
  const btn = (label: string, onClick?: () => void, danger = false) => (
    <button
      type="button"
      disabled={busy || !onClick}
      onClick={onClick}
      style={{
        marginRight: 6,
        marginBottom: 4,
        padding: '4px 8px',
        background: danger ? '#5c2b2b' : '#3c4043',
        color: '#e8eaed',
        border: 'none',
        borderRadius: 4,
        cursor: onClick ? 'pointer' : 'default',
        opacity: onClick ? 1 : 0.5,
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {blocked && <span style={{ color: '#f28b82', marginRight: 8 }}>blocked</span>}
      {btn('Block name', onBlockDisplay)}
      {btn('Block account', onBlockAccount)}
      {btn('Purge log', onPurge)}
      {btn('Delete account', onDelete, true)}
    </div>
  );
}
