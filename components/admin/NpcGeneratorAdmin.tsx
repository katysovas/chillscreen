'use client';

import { useEffect, useMemo, useState } from 'react';
import { STAGE_CHANNEL_META } from '@/lib/stageChannelLabels';
import type { StageChannel } from '@/lib/stageVideos';
import { dedupeGeneratedNpcs, parseGeneratedNpcs, type GeneratedNpc } from '@/lib/npcGenerator';

const PAGE_STYLE: React.CSSProperties = {
  maxWidth: 1080,
  margin: '0 auto',
  padding: '32px 24px 80px',
  fontFamily: 'system-ui, sans-serif',
};

const CARD_STYLE: React.CSSProperties = {
  background: '#181c26',
  border: '1px solid #2a3040',
  borderRadius: 10,
  padding: 16,
};

const BUTTON_STYLE: React.CSSProperties = {
  background: '#2d6cdf',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const ARCHETYPE_COLORS: Record<GeneratedNpc['archetype'], string> = {
  chiller: '#4fd8ff',
  dancer: '#ff3df0',
  wanderer: '#ffd23f',
  vendor: '#3dffb0',
  hustler: '#ff9d3d',
};

export function NpcGeneratorAdmin() {
  const [channel, setChannel] = useState<StageChannel>('silent-disco');
  const [count, setCount] = useState(20);
  const [npcs, setNpcs] = useState<GeneratedNpc[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const accumulatedNames = useMemo(() => npcs.map(n => n.name), [npcs]);

  // Load this stage's saved NPCs so batches append instead of overwriting.
  useEffect(() => {
    let cancelled = false;
    setNpcs([]);
    setSavedAt(null);
    void fetch('/api/admin/generated-npcs')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled || !data) return;
        const saved = (data.channels?.[channel] ?? []) as GeneratedNpc[];
        if (saved.length > 0) setNpcs(saved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [channel]);

  const saveToGame = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/generated-npcs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, npcs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setSavedAt(data.updatedAt as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const importPasted = () => {
    setError(null);
    try {
      const parsed = parseGeneratedNpcs(pasteText);
      const known = new Set(npcs.map(n => n.name));
      setNpcs(prev => dedupeGeneratedNpcs([...prev, ...parsed.filter(n => !known.has(n.name))]));
      setSavedAt(null);
      setPasteText('');
      setShowPaste(false);
    } catch (err) {
      setError(err instanceof Error ? `Paste failed: ${err.message}` : 'Paste failed');
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setCopied(false);
    setSavedAt(null);
    try {
      const res = await fetch('/api/admin/generate-npcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          count,
          // Pass batch names so multi-batch runs stay duplicate-free.
          existingNames: accumulatedNames,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setNpcs(prev => dedupeGeneratedNpcs([...prev, ...(data.npcs as GeneratedNpc[])]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ npcs }, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard write failed');
    }
  };

  return (
    <div style={PAGE_STYLE}>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>NPC Generator</h1>
      <p style={{ color: '#9aa3b5', margin: '0 0 8px', fontSize: 14 }}>
        Localhost only. Generates ambient crowd NPCs per stage — batches accumulate, and
        names from earlier batches are excluded automatically. Hit <strong>Save to game</strong>{' '}
        to write <code style={{ color: '#8ab4f8' }}>data/generated-npcs.json</code> — those NPCs
        spawn on that stage&apos;s city page. You can also paste previously copied JSON.
      </p>
      <nav style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <a href="/admin/stage-playlists" style={{ color: '#8ab4f8', fontSize: 13, textDecoration: 'none' }}>Stage playlists</a>
        <a href="/admin/npc-generator" style={{ color: '#8ab4f8', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>NPC generator</a>
        <a href="/admin/seeds" style={{ color: '#8ab4f8', fontSize: 13, textDecoration: 'none' }}>Seeds</a>
      </nav>

      <div style={{ ...CARD_STYLE, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#9aa3b5' }}>
          Stage
          <select
            value={channel}
            onChange={e => setChannel(e.target.value as StageChannel)}
            style={{
              background: '#10131c',
              color: '#e8eaed',
              border: '1px solid #2a3040',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 14,
              minWidth: 220,
            }}
          >
            {STAGE_CHANNEL_META.map(meta => (
              <option key={meta.id} value={meta.id}>
                {meta.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#9aa3b5' }}>
          NPCs per batch
          <input
            type="number"
            min={1}
            max={30}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            style={{
              background: '#10131c',
              color: '#e8eaed',
              border: '1px solid #2a3040',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 14,
              width: 110,
            }}
          />
        </label>

        <button
          onClick={() => void generate()}
          disabled={generating}
          style={{ ...BUTTON_STYLE, opacity: generating ? 0.6 : 1 }}
        >
          {generating ? 'Generating…' : npcs.length > 0 ? 'Generate another batch' : 'Generate'}
        </button>

        {npcs.length > 0 && (
          <>
            <button
              onClick={() => void saveToGame()}
              disabled={saving}
              style={{ ...BUTTON_STYLE, background: '#1f8a5b', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : savedAt ? 'Saved ✓' : `Save to game (${npcs.length} NPCs)`}
            </button>
            <button
              onClick={() => void copyJson()}
              style={{ ...BUTTON_STYLE, background: '#3a4154' }}
            >
              {copied ? 'Copied ✓' : 'Copy JSON'}
            </button>
            <button
              onClick={() => { setNpcs([]); setSavedAt(null); }}
              style={{ ...BUTTON_STYLE, background: '#3a4154' }}
            >
              Clear
            </button>
          </>
        )}

        <button
          onClick={() => setShowPaste(s => !s)}
          style={{ ...BUTTON_STYLE, background: '#3a4154' }}
        >
          Paste JSON
        </button>
      </div>

      {showPaste && (
        <div style={{ ...CARD_STYLE, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder='{"npcs": [ ... ]}'
            rows={10}
            style={{
              background: '#10131c',
              color: '#e8eaed',
              border: '1px solid #2a3040',
              borderRadius: 6,
              padding: 12,
              fontSize: 13,
              fontFamily: 'ui-monospace, monospace',
              resize: 'vertical',
            }}
          />
          <div>
            <button onClick={importPasted} style={BUTTON_STYLE}>
              Import into batch
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            ...CARD_STYLE,
            marginTop: 16,
            borderColor: '#a13a3a',
            color: '#ff9d9d',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {npcs.map((npc, i) => (
          <div key={`${npc.name}-${i}`} style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <strong style={{ fontSize: 17 }}>{npc.name}</strong>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: ARCHETYPE_COLORS[npc.archetype] ?? '#9aa3b5',
                  border: `1px solid ${ARCHETYPE_COLORS[npc.archetype] ?? '#9aa3b5'}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                }}
              >
                {npc.archetype}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#9aa3b5', marginBottom: 8 }}>
              outfit: <code>{npc.outfit}</code> · prop: <code>{npc.prop ?? 'null'}</code>
            </div>
            <div style={{ fontSize: 14, marginBottom: 8, color: '#cdd4e0' }}>{npc.vibe}</div>
            <div style={{ fontSize: 13, color: '#9aa3b5', marginBottom: 12, lineHeight: 1.5 }}>
              {npc.personalityNotes}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: '#cdd4e0' }}>
              {npc.lines.map((line, j) => (
                <li key={j}>“{line}”</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
