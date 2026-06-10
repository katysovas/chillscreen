'use client';

import { useMemo, useState } from 'react';
import { STAGE_CHANNEL_META } from '@/lib/stageChannelLabels';
import type { StageChannel } from '@/lib/stageVideos';
import type { GeneratedNpc } from '@/lib/npcGenerator';

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

  const accumulatedNames = useMemo(() => npcs.map(n => n.name), [npcs]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setCopied(false);
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
      setNpcs(prev => [...prev, ...(data.npcs as GeneratedNpc[])]);
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
      <p style={{ color: '#9aa3b5', margin: '0 0 24px', fontSize: 14 }}>
        Localhost only. Generates ambient crowd NPCs per stage — batches accumulate, and
        names from earlier batches are excluded automatically. Copy the JSON when happy.
      </p>

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
              onClick={() => void copyJson()}
              style={{ ...BUTTON_STYLE, background: '#1f8a5b' }}
            >
              {copied ? 'Copied ✓' : `Copy JSON (${npcs.length} NPCs)`}
            </button>
            <button
              onClick={() => setNpcs([])}
              style={{ ...BUTTON_STYLE, background: '#3a4154' }}
            >
              Clear
            </button>
          </>
        )}
      </div>

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
