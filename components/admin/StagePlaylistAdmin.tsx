'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminNav } from './AdminNav';
import { isMatchupChannel } from '@/lib/matchup/config';
import {
  bucketAdminLabel,
  newStreamerBucket,
  type MatchupStageConfig,
  type MatchupStreamerBucket,
} from '@/lib/matchup/playlists';
import { normalizeMatchupConfig } from '@/lib/matchup/normalize';
import { STAGE_CHANNEL_META } from '@/lib/stageChannelLabels';
import { formatDurationSec, videoBrowseUrl, youtubeThumbnailUrl } from '@/lib/stagePlaylistUtils';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';
import type { YoutubeAdminSearchResult } from '@/lib/youtubeApi';

type ChannelState = {
  label: string;
  source: 'curated' | 'youtube-api';
  searchQuery?: string;
  videos: StageVideo[];
  matchup?: MatchupStageConfig;
};


type PlaylistsResponse = {
  updatedAt: string;
  channels: Record<
    StageChannel,
    ChannelState & { storedVideos?: StageVideo[]; matchup?: MatchupStageConfig }
  >;
};

function toStageVideo(
  r: YoutubeAdminSearchResult,
  channelMeta?: { channelTitle?: string; channelUrl?: string },
): StageVideo {
  return {
    id: r.id,
    title: r.title,
    channelTitle: r.channelTitle ?? channelMeta?.channelTitle,
    ...(channelMeta?.channelUrl ? { channelUrl: channelMeta.channelUrl } : {}),
    ...(r.durationSec != null && r.durationSec > 0 ? { durationSec: r.durationSec } : {}),
  };
}

function channelVideoCount(
  channel: StageChannel,
  state: ChannelState | undefined,
): number {
  if (!state) return 0;
  if (isMatchupChannel(channel) && state.matchup) {
    return state.matchup.streamers.reduce((n, s) => n + s.videos.length, 0);
  }
  return state.videos.length;
}

type StagePlaylistAdminProps = {
  /** Pre-select channel (e.g. current built-in stage). */
  initialChannel?: StageChannel;
  /** In-game modal — hide admin chrome. */
  embedded?: boolean;
};

export function StagePlaylistAdmin({
  initialChannel = 'which-stage',
  embedded = false,
}: StagePlaylistAdminProps = {}) {
  const [activeChannel, setActiveChannel] = useState<StageChannel>(initialChannel);
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
  const [channelInput, setChannelInput] = useState('');
  const [channelMax, setChannelMax] = useState(24);
  const [channelMinMin, setChannelMinMin] = useState(40);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [channelQuotaExceeded, setChannelQuotaExceeded] = useState(false);
  const [channelMeta, setChannelMeta] = useState<{ channelTitle?: string; channelUrl?: string } | null>(null);
  const [channelResults, setChannelResults] = useState<YoutubeAdminSearchResult[]>([]);
  const [channelScannedCount, setChannelScannedCount] = useState<number | null>(null);
  const [activeStreamerIndex, setActiveStreamerIndex] = useState(0);

  useEffect(() => {
    setActiveChannel(initialChannel);
  }, [initialChannel]);

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
          matchup: ch.matchup ? normalizeMatchupConfig(ch.matchup) ?? undefined : undefined,
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

  useEffect(() => {
    setActiveStreamerIndex(0);
  }, [activeChannel]);

  const active = channels[activeChannel];
  const activeVideos = active?.videos ?? [];
  const matchupMode = isMatchupChannel(activeChannel);
  const matchup = useMemo(() => {
    if (!matchupMode) return null;
    if (active?.matchup) return active.matchup;
    return { streamers: [newStreamerBucket([])] };
  }, [active?.matchup, matchupMode]);

  const activeStreamer = matchup?.streamers[activeStreamerIndex];
  const bucketVideos = matchupMode && activeStreamer
    ? activeStreamer.videos
    : activeVideos;
  const activeIds = useMemo(() => new Set(bucketVideos.map(v => v.id)), [bucketVideos]);

  const setActiveVideos = (videos: StageVideo[]) => {
    setChannels(prev => ({
      ...prev,
      [activeChannel]: {
        label: prev[activeChannel]?.label ?? activeChannel,
        source: 'curated',
        videos,
        matchup: prev[activeChannel]?.matchup,
      },
    }));
  };

  const setMatchup = (next: MatchupStageConfig) => {
    setChannels(prev => ({
      ...prev,
      [activeChannel]: {
        label: prev[activeChannel]?.label ?? activeChannel,
        source: prev[activeChannel]?.source ?? 'curated',
        videos: prev[activeChannel]?.videos ?? [],
        matchup: next,
      },
    }));
  };

  const setBucketVideos = (videos: StageVideo[]) => {
    if (!matchup || !activeStreamer) return;
    setMatchup({
      streamers: matchup.streamers.map((s, i) =>
        i === activeStreamerIndex ? { ...s, videos } : s,
      ),
    });
  };

  const addStreamer = () => {
    if (!matchup) return;
    const bucket = newStreamerBucket(matchup.streamers);
    setMatchup({ streamers: [...matchup.streamers, bucket] });
    setActiveStreamerIndex(matchup.streamers.length);
  };

  const removeStreamer = () => {
    if (!matchup || matchup.streamers.length <= 1) return;
    const streamers = matchup.streamers.filter((_, i) => i !== activeStreamerIndex);
    setMatchup({ streamers });
    setActiveStreamerIndex(i => Math.min(i, streamers.length - 1));
  };

  const setStreamerName = (name: string) => {
    if (!matchup || !activeStreamer) return;
    setMatchup({
      streamers: matchup.streamers.map((s, i) =>
        i === activeStreamerIndex ? { ...s, name: name || undefined } : s,
      ),
    });
  };

  const setListVideos = matchupMode ? setBucketVideos : setActiveVideos;

  const addVideo = (video: StageVideo) => {
    if (activeIds.has(video.id)) return;
    setListVideos([...bucketVideos, video]);
  };

  const addVideos = (videos: StageVideo[]) => {
    const seen = new Set(activeIds);
    const next = [...bucketVideos];
    for (const video of videos) {
      if (seen.has(video.id)) continue;
      seen.add(video.id);
      next.push(video);
    }
    if (next.length !== bucketVideos.length) setListVideos(next);
  };

  const removeVideo = (id: string) => {
    setListVideos(bucketVideos.filter(v => v.id !== id));
  };

  const moveVideo = (index: number, dir: -1 | 1) => {
    const next = [...bucketVideos];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    setListVideos(next);
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

  const runChannelFetch = async () => {
    const input = channelInput.trim();
    if (!input) return;
    setChannelLoading(true);
    setChannelError(null);
    setChannelQuotaExceeded(false);
    setChannelResults([]);
    setChannelMeta(null);
    setChannelScannedCount(null);
    try {
      const params = new URLSearchParams({
        channel: input,
        max: String(channelMax),
        minMin: String(channelMinMin),
      });
      const res = await fetch(`/api/admin/youtube-channel?${params}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.quotaExceeded) setChannelQuotaExceeded(true);
        throw new Error(data.error ?? res.statusText);
      }
      setChannelMeta({
        channelTitle: data.channelTitle,
        channelUrl: data.channelUrl,
      });
      setChannelResults(data.results ?? []);
      setChannelScannedCount(typeof data.scannedCount === 'number' ? data.scannedCount : null);
    } catch (err) {
      setChannelError(err instanceof Error ? err.message : 'Channel fetch failed');
    } finally {
      setChannelLoading(false);
    }
  };

  const addAllChannelVideos = () => {
    if (!channelResults.length) return;
    addVideos(channelResults.map(r => toStageVideo(r, channelMeta ?? undefined)));
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
      const body: Record<string, unknown> = { channel: activeChannel, asCurated: true };
      if (matchupMode && matchup) {
        body.matchup = matchup;
      } else {
        body.videos = activeVideos;
      }
      const res = await fetch('/api/admin/stage-playlists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      const label = STAGE_CHANNEL_META.find(c => c.id === activeChannel)?.label ?? activeChannel;
      setSaveStatus(
        matchupMode
          ? `Saved ${label} matchup buckets`
          : `Saved ${label} playlist`,
      );
      setUpdatedAt(data.updatedAt ?? null);
      await loadPlaylists();
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      maxWidth: embedded ? undefined : 1100,
      margin: embedded ? undefined : '0 auto',
      padding: embedded ? '0 0 24px' : '24px 20px 80px',
    }}
    >
      {!embedded && (
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
      )}

      {embedded && updatedAt ? (
        <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          Last saved {new Date(updatedAt).toLocaleString()} · refresh the page after saving to hear changes
        </p>
      ) : null}

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
              ({channelVideoCount(meta.id, channels[meta.id])})
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Saved playlist / matchup buckets */}
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={h2Style}>
              {STAGE_CHANNEL_META.find(c => c.id === activeChannel)?.label}
              {matchupMode ? ' vote buckets' : ' playlist'}
            </h2>
            <button type="button" onClick={() => void saveChannel()} disabled={saving} style={primaryBtn}>
              {saving ? 'Saving…' : 'Save to JSON'}
            </button>
          </div>
          {matchupMode && matchup && (
            <>
              <p style={{ margin: '0 0 12px', color: '#9aa0a6', fontSize: 12, lineHeight: 1.45 }}>
                King-of-the-hill playback rotates through each streamer&apos;s bucket in order, then loops.
                The winner keeps playing only from their list.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {matchup.streamers.map((streamer, index) => (
                  <button
                    key={streamer.id}
                    type="button"
                    onClick={() => setActiveStreamerIndex(index)}
                    style={tabStyle(activeStreamerIndex === index)}
                  >
                    {bucketAdminLabel(streamer)}
                    <span style={{ opacity: 0.55, marginLeft: 6, fontSize: 11 }}>
                      ({streamer.videos.length})
                    </span>
                  </button>
                ))}
                <button type="button" onClick={addStreamer} style={ghostBtn}>
                  + Streamer
                </button>
                {matchup.streamers.length > 1 && (
                  <button type="button" onClick={removeStreamer} style={{ ...ghostBtn, color: '#f87171' }}>
                    Remove
                  </button>
                )}
              </div>
              {activeStreamer && (
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#9aa0a6', display: 'block', marginBottom: 4 }}>
                    Tab label (optional — vote UI uses YouTube channel names)
                  </span>
                  <input
                    value={activeStreamer.name ?? ''}
                    onChange={e => setStreamerName(e.target.value)}
                    placeholder={bucketAdminLabel(activeStreamer)}
                    style={inputStyle}
                  />
                </label>
              )}
            </>
          )}
          {saveStatus && (
            <div style={{ ...bannerStyle('#1e3a2f', '#86efac'), marginBottom: 12 }}>{saveStatus}</div>
          )}
          {bucketVideos.length === 0 ? (
            <p style={{ color: '#9aa0a6', fontSize: 14 }}>
              No videos yet — search and add from the right.
              {matchupMode && ' Videos play in list order, then loop.'}
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bucketVideos.map((v, i) => (
                <li key={v.id} style={rowStyle}>
                  <a
                    href={videoBrowseUrl(v)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open on YouTube"
                    style={{ flexShrink: 0 }}
                  >
                    <img src={youtubeThumbnailUrl(v.id)} alt="" width={80} height={45} style={thumbStyle} />
                  </a>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={videoBrowseUrl(v)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        color: '#93c5fd',
                        textDecoration: 'none',
                      }}
                    >
                      {v.title}
                    </a>
                    <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>
                      {v.channelTitle && <span>{v.channelTitle} · </span>}
                      {v.id} · {formatDurationSec(v.durationSec)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button type="button" style={iconBtn} onClick={() => moveVideo(i, -1)} disabled={i === 0}>↑</button>
                    <button type="button" style={iconBtn} onClick={() => moveVideo(i, 1)} disabled={i === bucketVideos.length - 1}>↓</button>
                    <button type="button" style={{ ...iconBtn, color: '#f87171' }} onClick={() => removeVideo(v.id)}>✕</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* YouTube search + paste URL */}
        <section style={panelStyle}>
          <h2 style={h2Style}>Get videos by channel</h2>
          <p style={{ margin: '0 0 10px', color: '#9aa0a6', fontSize: 12, lineHeight: 1.45 }}>
            Paste a channel URL, <code>@handle</code>, or <code>UC…</code> id to load recent uploads in bulk.
            With a min length set, scans up to 200 recent uploads to find long-form sets.
          </p>
          <form
            onSubmit={e => {
              e.preventDefault();
              void runChannelFetch();
            }}
            style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}
          >
            <input
              value={channelInput}
              onChange={e => setChannelInput(e.target.value)}
              placeholder="https://youtube.com/@ChillCorner or @handle"
              style={{ ...inputStyle, minWidth: 220 }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9aa0a6' }}>
              Min
              <select
                value={channelMinMin}
                onChange={e => setChannelMinMin(Number(e.target.value))}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #3a4048',
                  background: '#0f1117',
                  color: '#e8eaed',
                }}
              >
                <option value={0}>Any length</option>
                <option value={20}>20+ min</option>
                <option value={40}>40+ min</option>
                <option value={60}>60+ min</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9aa0a6' }}>
              Max
              <select
                value={channelMax}
                onChange={e => setChannelMax(Number(e.target.value))}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #3a4048',
                  background: '#0f1117',
                  color: '#e8eaed',
                }}
              >
                {[12, 24, 36, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={channelLoading} style={primaryBtn}>
              {channelLoading ? '…' : 'Fetch'}
            </button>
          </form>
          {channelError && (
            <div style={{
              ...bannerStyle(channelQuotaExceeded ? '#4a3a12' : '#5c2b2b', channelQuotaExceeded ? '#fde68a' : '#f8b4b4'),
              marginBottom: 12,
            }}>
              {channelError}
            </div>
          )}
          {channelMeta?.channelTitle && channelResults.length === 0 && !channelLoading && (
            <div style={{ ...bannerStyle('#4a3a12', '#fde68a'), marginBottom: 12 }}>
              No embeddable videos matched
              {channelMinMin > 0 ? ` (${channelMinMin}+ min` : ''}
              {channelScannedCount != null && channelMinMin > 0 ? `, scanned ${channelScannedCount} uploads` : ''}
              {channelMinMin > 0 ? ')' : ''}.
              Try a lower min length or fetch more uploads.
            </div>
          )}
          {channelMeta?.channelTitle && channelResults.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: '#c4c7cc' }}>
                {channelMeta.channelUrl ? (
                  <a href={channelMeta.channelUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd' }}>
                    {channelMeta.channelTitle}
                  </a>
                ) : (
                  channelMeta.channelTitle
                )}
                <span style={{ color: '#9aa0a6' }}>
                  {' · '}
                  {channelResults.length} video{channelResults.length === 1 ? '' : 's'}
                  {channelMinMin > 0 && ` (${channelMinMin}+ min)`}
                  {channelScannedCount != null && channelMinMin > 0 && channelScannedCount > channelResults.length
                    ? ` · scanned ${channelScannedCount} uploads`
                    : ''}
                </span>
              </div>
              <button type="button" onClick={addAllChannelVideos} style={primaryBtn}>
                Add all to {matchupMode ? 'bucket' : 'playlist'}
              </button>
            </div>
          )}
          {channelResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto', marginBottom: 20 }}>
              {channelResults.map(r => {
                const added = activeIds.has(r.id);
                const warn = !r.embeddable || r.durationSec == null;
                return (
                  <div key={r.id} style={rowStyle}>
                    <img src={r.thumbnailUrl} alt="" width={96} height={54} style={thumbStyle} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>
                        {formatDurationSec(r.durationSec)}
                        {warn && <span style={{ color: '#fbbf24' }}> · may not embed</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => addVideo(toStageVideo(r, channelMeta ?? undefined))}
                      style={{ ...primaryBtn, opacity: added ? 0.45 : 1, flexShrink: 0 }}
                    >
                      {added ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

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

const ghostBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid #3a4048',
  background: 'transparent',
  color: '#93c5fd',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
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
