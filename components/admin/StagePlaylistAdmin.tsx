'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminNav } from './AdminNav';
import { STAGE_CHANNEL_META } from '@/lib/stageChannelLabels';
import { formatDurationSec, youtubeThumbnailUrl } from '@/lib/stagePlaylistUtils';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';
import type { YoutubeAdminSearchResult } from '@/lib/youtubeApi';

type ChannelState = {
  label: string;
  source: 'curated' | 'youtube-api';
  searchQuery?: string;
  videos: StageVideo[];
};

type PlaylistsResponse = {
  updatedAt: string;
  channels: Record<
    StageChannel,
    ChannelState & { storedVideos?: StageVideo[] }
  >;
};

function toStageVideo(r: YoutubeAdminSearchResult): StageVideo {
  return {
    id: r.id,
    title: r.title,
    ...(r.durationSec != null && r.durationSec > 0 ? { durationSec: r.durationSec } : {}),
  };
}

export function StagePlaylistAdmin() {
  const [activeChannel, setActiveChannel] = useState<StageChannel>('which-stage');
  const [channels, setChannels] = useState<Partial<Record<StageChannel, ChannelState>>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuotaExceeded, setSearchQuotaExceeded] = useState(false);
  const [results, setResults] = useState<YoutubeAdminSearchResult[]>([]);

  const [pasteUrl, setPasteUrl] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<(YoutubeAdminSearchResult & { metaSource?: string }) | null>(null);

  const loadPlaylists = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/stage-playlists');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      const body = data as PlaylistsResponse;
      setUpdatedAt(body.updatedAt);
      const next: Partial<Record<StageChannel, ChannelState>> = {};
      for (const meta of STAGE_CHANNEL_META) {
        const ch = body.channels[meta.id];
        if (!ch) continue;
        next[meta.id] = {
          label: ch.label ?? meta.label,
          source: ch.source,
          searchQuery: ch.searchQuery,
          videos: ch.storedVideos ?? ch.videos ?? [],
        };
      }
      setChannels(next);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  const active = channels[activeChannel];
  const activeVideos = active?.videos ?? [];
  const activeIds = useMemo(() => new Set(activeVideos.map(v => v.id)), [activeVideos]);

  const setActiveVideos = (videos: StageVideo[]) => {
    setChannels(prev => ({
      ...prev,
      [activeChannel]: {
        label: prev[activeChannel]?.label ?? activeChannel,
        source: 'curated',
        videos,
      },
    }));
  };

  const addVideo = (video: StageVideo) => {
    if (activeIds.has(video.id)) return;
    setActiveVideos([...activeVideos, video]);
  };

  const removeVideo = (id: string) => {
    setActiveVideos(activeVideos.filter(v => v.id !== id));
  };

  const moveVideo = (index: number, dir: -1 | 1) => {
    const next = [...activeVideos];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    setActiveVideos(next);
  };

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setSearchQuotaExceeded(false);
    try {
      const res = await fetch(`/api/admin/youtube-search?q=${encodeURIComponent(q)}&max=24`);
      const data = await res.json();
      if (!res.ok) {
        if (data.quotaExceeded) setSearchQuotaExceeded(true);
        throw new Error(data.error ?? res.statusText);
      }
      setResults(data.results ?? []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const runLookup = async () => {
    const input = pasteUrl.trim();
    if (!input) return;
    setLookingUp(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/admin/youtube-video?url=${encodeURIComponent(input)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setLookupResult(data.video ?? null);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLookingUp(false);
    }
  };

  const saveChannel = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/admin/stage-playlists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: activeChannel,
          videos: activeVideos,
          asCurated: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setSaveStatus(`Saved ${STAGE_CHANNEL_META.find(c => c.id === activeChannel)?.label ?? activeChannel}`);
      setUpdatedAt(data.updatedAt ?? null);
      await loadPlaylists();
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px' }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Stage playlist admin</h1>
        <p style={{ margin: 0, color: '#9aa0a6', fontSize: 14, lineHeight: 1.5 }}>
          Localhost only · writes to <code style={{ color: '#8ab4f8' }}>data/stage-playlists.json</code>
          {updatedAt && (
            <span> · last saved {new Date(updatedAt).toLocaleString()}</span>
          )}
        </p>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
          After saving, refresh the game tab. Restart <code>party:dev</code> if PartyKit playlists look stale.
          YouTube search is limited to ~100/day — use <strong style={{ color: '#9aa0a6' }}>Add by URL</strong> when quota runs out.
        </p>
        <nav style={{ marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <AdminNav active="playlists" />
        </nav>
      </header>

      {loadError && (
        <div style={bannerStyle('#5c2b2b', '#f8b4b4')}>{loadError}</div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {STAGE_CHANNEL_META.map(meta => (
          <button
            key={meta.id}
            type="button"
            onClick={() => setActiveChannel(meta.id)}
            style={tabStyle(activeChannel === meta.id)}
          >
            {meta.label}
            <span style={{ opacity: 0.55, marginLeft: 6, fontSize: 11 }}>
              ({channels[meta.id]?.videos.length ?? 0})
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Saved playlist */}
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={h2Style}>
              {STAGE_CHANNEL_META.find(c => c.id === activeChannel)?.label} playlist
            </h2>
            <button type="button" onClick={() => void saveChannel()} disabled={saving} style={primaryBtn}>
              {saving ? 'Saving…' : 'Save to JSON'}
            </button>
          </div>
          {saveStatus && (
            <div style={{ ...bannerStyle('#1e3a2f', '#86efac'), marginBottom: 12 }}>{saveStatus}</div>
          )}
          {activeVideos.length === 0 ? (
            <p style={{ color: '#9aa0a6', fontSize: 14 }}>No videos yet — search and add from the right.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeVideos.map((v, i) => (
                <li key={v.id} style={rowStyle}>
                  <img src={youtubeThumbnailUrl(v.id)} alt="" width={80} height={45} style={thumbStyle} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>
                      {v.id} · {formatDurationSec(v.durationSec)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button type="button" style={iconBtn} onClick={() => moveVideo(i, -1)} disabled={i === 0}>↑</button>
                    <button type="button" style={iconBtn} onClick={() => moveVideo(i, 1)} disabled={i === activeVideos.length - 1}>↓</button>
                    <button type="button" style={{ ...iconBtn, color: '#f87171' }} onClick={() => removeVideo(v.id)}>✕</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* YouTube search + paste URL */}
        <section style={panelStyle}>
          <h2 style={h2Style}>Add by URL or video ID</h2>
          <p style={{ margin: '0 0 10px', color: '#9aa0a6', fontSize: 12, lineHeight: 1.45 }}>
            No search quota — paste a YouTube link or 11-character id. Uses oEmbed when API quota is exhausted.
          </p>
          <form
            onSubmit={e => {
              e.preventDefault();
              void runLookup();
            }}
            style={{ display: 'flex', gap: 8, marginBottom: 10 }}
          >
            <input
              value={pasteUrl}
              onChange={e => setPasteUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=… or dQw4w9WgXcQ"
              style={inputStyle}
            />
            <button type="submit" disabled={lookingUp} style={primaryBtn}>
              {lookingUp ? '…' : 'Look up'}
            </button>
          </form>
          {lookupError && (
            <div style={{ ...bannerStyle('#5c2b2b', '#f8b4b4'), marginBottom: 12 }}>{lookupError}</div>
          )}
          {lookupResult && (
            <div style={{ ...rowStyle, marginBottom: 16 }}>
              <img src={lookupResult.thumbnailUrl} alt="" width={96} height={54} style={thumbStyle} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{lookupResult.title}</div>
                <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>
                  {lookupResult.channelTitle && <span>{lookupResult.channelTitle} · </span>}
                  {formatDurationSec(lookupResult.durationSec)}
                  {lookupResult.metaSource === 'oembed' && (
                    <span style={{ color: '#fbbf24' }}> · duration unknown (oEmbed)</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={activeIds.has(lookupResult.id)}
                onClick={() => {
                  addVideo(toStageVideo(lookupResult));
                  setPasteUrl('');
                  setLookupResult(null);
                }}
                style={{ ...primaryBtn, opacity: activeIds.has(lookupResult.id) ? 0.45 : 1, flexShrink: 0 }}
              >
                {activeIds.has(lookupResult.id) ? 'Added' : 'Add'}
              </button>
            </div>
          )}

          <h2 style={{ ...h2Style, marginTop: 8 }}>YouTube search</h2>
          <p style={{ margin: '0 0 10px', color: '#9aa0a6', fontSize: 12 }}>
            Uses search quota (~100/day on free tier).
          </p>
          <form
            onSubmit={e => {
              e.preventDefault();
              void runSearch();
            }}
            style={{ display: 'flex', gap: 8, marginBottom: 14 }}
          >
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. bonnaroo full set"
              style={inputStyle}
            />
            <button type="submit" disabled={searching} style={primaryBtn}>
              {searching ? '…' : 'Search'}
            </button>
          </form>
          {searchError && (
            <div style={{
              ...bannerStyle(searchQuotaExceeded ? '#4a3a12' : '#5c2b2b', searchQuotaExceeded ? '#fde68a' : '#f8b4b4'),
              marginBottom: 12,
            }}>
              {searchError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
            {results.map(r => {
              const added = activeIds.has(r.id);
              const warn = !r.embeddable || r.durationSec == null;
              return (
                <div key={r.id} style={rowStyle}>
                  <img src={r.thumbnailUrl} alt="" width={96} height={54} style={thumbStyle} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>
                      {r.channelTitle && <span>{r.channelTitle} · </span>}
                      {formatDurationSec(r.durationSec)}
                      {warn && <span style={{ color: '#fbbf24' }}> · may not embed</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => addVideo(toStageVideo(r))}
                    style={{ ...primaryBtn, opacity: added ? 0.45 : 1, flexShrink: 0 }}
                  >
                    {added ? 'Added' : 'Add'}
                  </button>
                </div>
              );
            })}
            {!searching && results.length === 0 && (
              <p style={{ color: '#6b7280', fontSize: 13 }}>Search results appear here.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: '#181b22',
  border: '1px solid #2a2f3a',
  borderRadius: 10,
  padding: 16,
};

const h2Style: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: 15,
  fontWeight: 700,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  padding: 8,
  background: '#12151c',
  borderRadius: 8,
  border: '1px solid #252932',
};

const thumbStyle: React.CSSProperties = {
  borderRadius: 4,
  objectFit: 'cover',
  flexShrink: 0,
  background: '#000',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #3a4048',
  background: '#0f1117',
  color: '#e8eaed',
  fontSize: 14,
};

const primaryBtn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#3b82f6',
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};

const iconBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid #3a4048',
  background: '#1f2430',
  color: '#e8eaed',
  cursor: 'pointer',
  fontSize: 12,
};

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: 999,
    border: active ? '1px solid #3b82f6' : '1px solid #3a4048',
    background: active ? '#1e3a5f' : '#181b22',
    color: active ? '#93c5fd' : '#c4c7cc',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  };
}

function bannerStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 8,
    background: bg,
    color,
    fontSize: 13,
  };
}
