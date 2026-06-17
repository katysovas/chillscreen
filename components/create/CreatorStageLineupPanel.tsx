'use client';

import { useState, type CSSProperties } from 'react';
import { useCreatorStageControls } from '@/lib/stages/CreatorStageContext';
import { STAGE_CONFIG } from '@/lib/stages/config';
import { reorderStageStreams } from '@/lib/stages/lineup';
import { parseStageStreams, updateUserStage } from '@/lib/stages/client';
import { truncateWithEllipsis } from '@/lib/stages/streamLabel';
import type { StageStream } from '@/lib/stages/types';
import type { StageStreamPasteMode } from '@/lib/stages/parseStream';

export function CreatorStageLineupPanel() {
  const ctx = useCreatorStageControls();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamInput, setStreamInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [streamPasteMode, setStreamPasteMode] = useState<StageStreamPasteMode>('video');
  const [streamHint, setStreamHint] = useState<string | null>(null);
  const [streamParsing, setStreamParsing] = useState(false);
  const [playNowIndex, setPlayNowIndex] = useState<number | null>(null);

  if (!ctx?.isOwner) return null;

  const { stage, setStage, playNow } = ctx;

  const persistStreams = async (
    streams: StageStream[],
    nowPlayingIndex = stage.nowPlayingIndex,
  ) => {
    const updated = await updateUserStage(stage.slug, { streams, nowPlayingIndex });
    setStage(updated, { broadcast: true });
  };

  const toggleShuffleOnStart = async (enabled: boolean) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateUserStage(stage.slug, { shuffleOnStart: enabled });
      setStage(updated, { broadcast: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update shuffle setting');
    } finally {
      setBusy(false);
    }
  };

  const addStream = async () => {
    const url = streamInput.trim();
    if (!url || streamParsing || busy) return;
    const slotsLeft = STAGE_CONFIG.MAX_STREAMS - stage.streams.length;
    if (slotsLeft <= 0) {
      setError(`Maximum ${STAGE_CONFIG.MAX_STREAMS} streams.`);
      return;
    }
    setError(null);
    setStreamHint(null);
    setStreamParsing(true);
    try {
      const result = await parseStageStreams(url, streamPasteMode, {
        existingVideoIds: stage.streams.map(s => s.videoId),
        maxToAdd: slotsLeft,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }

      let nextStreams = stage.streams;
      if ('stream' in result) {
        if (stage.streams.some(s => s.videoId === result.stream.videoId)) {
          setError('That video is already in your lineup.');
          return;
        }
        nextStreams = [...stage.streams, result.stream];
      } else {
        if (!result.streams.length) {
          setError('No videos could be added.');
          return;
        }
        nextStreams = [...stage.streams, ...result.streams];
        const added = result.streams.length;
        const skipped = result.skipped;
        setStreamHint(
          skipped > 0
            ? `Added ${added} video${added === 1 ? '' : 's'} (${skipped} skipped).`
            : `Added ${added} video${added === 1 ? '' : 's'}.`,
        );
      }

      await persistStreams(nextStreams);
      setStreamInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not parse videos');
    } finally {
      setStreamParsing(false);
    }
  };

  const addBulk = async () => {
    const text = bulkInput.trim();
    if (!text || streamParsing || busy) return;
    const slotsLeft = STAGE_CONFIG.MAX_STREAMS - stage.streams.length;
    if (slotsLeft <= 0) {
      setError(`Maximum ${STAGE_CONFIG.MAX_STREAMS} streams.`);
      return;
    }
    setError(null);
    setStreamHint(null);
    setStreamParsing(true);
    try {
      const result = await parseStageStreams(text, 'bulk', {
        existingVideoIds: stage.streams.map(s => s.videoId),
        maxToAdd: slotsLeft,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (!('streams' in result) || !result.streams.length) {
        setError('No videos could be added.');
        return;
      }
      const nextStreams = [...stage.streams, ...result.streams];
      await persistStreams(nextStreams);
      setBulkInput('');
      const added = result.streams.length;
      const skipped = result.skipped;
      setStreamHint(
        skipped > 0
          ? `Added ${added} video${added === 1 ? '' : 's'} (${skipped} skipped — duplicates or unavailable).`
          : `Added ${added} video${added === 1 ? '' : 's'}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import videos');
    } finally {
      setStreamParsing(false);
    }
  };

  const removeStream = async (videoId: string) => {
    if (busy || stage.streams.length <= 1) {
      setError('Keep at least one video in the lineup.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const removedIndex = stage.streams.findIndex(s => s.videoId === videoId);
      const nextStreams = stage.streams.filter(s => s.videoId !== videoId);
      let nowPlayingIndex = stage.nowPlayingIndex;
      if (removedIndex < nowPlayingIndex) nowPlayingIndex -= 1;
      else if (removedIndex === nowPlayingIndex) {
        nowPlayingIndex = Math.min(nowPlayingIndex, nextStreams.length - 1);
      }
      await persistStreams(nextStreams, nowPlayingIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove video');
    } finally {
      setBusy(false);
    }
  };

  const moveStream = async (fromIndex: number, toIndex: number) => {
    if (busy || toIndex < 0 || toIndex >= stage.streams.length) return;
    setBusy(true);
    setError(null);
    try {
      const { streams, nowPlayingIndex } = reorderStageStreams(
        stage.streams,
        fromIndex,
        toIndex,
        stage.nowPlayingIndex,
      );
      await persistStreams(streams, nowPlayingIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reorder lineup');
    } finally {
      setBusy(false);
    }
  };

  const handlePlayNow = async (index: number) => {
    if (busy || playNowIndex !== null || index === stage.nowPlayingIndex) return;
    setBusy(true);
    setPlayNowIndex(index);
    setError(null);
    try {
      await playNow(index);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not switch video');
    } finally {
      setBusy(false);
      setPlayNowIndex(null);
    }
  };

  return (
    <section>
      <p style={{
        margin: '0 0 12px',
        fontSize: 11,
        lineHeight: 1.4,
        color: 'rgba(255,255,255,0.5)',
      }}
      >
        Add videos, reorder the queue, and use Play now to switch what everyone sees on stage.
      </p>

      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 14,
          cursor: busy ? 'default' : 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={stage.shuffleOnStart}
          disabled={busy}
          onChange={e => void toggleShuffleOnStart(e.target.checked)}
          style={{ marginTop: 2, accentColor: '#e67e22' }}
        />
        <span>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff' }}>
            Shuffle on start
          </span>
          
        </span>
      </label>

      <div role="tablist" aria-label="Paste mode" style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {([
          { mode: 'video' as const, label: 'Video' },
          { mode: 'playlist' as const, label: 'Playlist' },
          { mode: 'channel' as const, label: 'Channel' },
          { mode: 'bulk' as const, label: 'Bulk' },
        ]).map(({ mode, label }) => {
          const active = streamPasteMode === mode;
          return (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={busy}
              onClick={() => {
                setStreamPasteMode(mode);
                setError(null);
                setStreamHint(null);
              }}
              style={{
                flex: 1,
                borderRadius: 8,
                padding: '6px 8px',
                fontSize: 11,
                fontWeight: 600,
                border: active
                  ? '1px solid rgba(230,126,34,0.5)'
                  : '1px solid rgba(255,255,255,0.1)',
                background: active ? 'rgba(230,126,34,0.16)' : 'rgba(255,255,255,0.04)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {streamPasteMode === 'bulk' ? (
        <div style={{ marginBottom: 10 }}>
          <textarea
            value={bulkInput}
            onChange={e => setBulkInput(e.target.value)}
            disabled={busy}
            placeholder={'https://youtube.com/watch?v=…\nhttps://youtube.com/watch?v=…'}
            spellCheck={false}
            rows={4}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              padding: '8px 10px',
              fontSize: 12,
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
          <button
            type="button"
            disabled={streamParsing || busy || !bulkInput.trim()}
            onClick={() => void addBulk()}
            style={{
              marginTop: 6,
              width: '100%',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)',
              color: '#fff',
              cursor: streamParsing || busy ? 'wait' : 'pointer',
              opacity: streamParsing || busy || !bulkInput.trim() ? 0.5 : 1,
            }}
          >
            {streamParsing ? 'Importing…' : 'Import all'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={streamInput}
            onChange={e => setStreamInput(e.target.value)}
            disabled={busy}
            placeholder={
              streamPasteMode === 'video'
                ? 'YouTube video URL'
                : streamPasteMode === 'playlist'
                  ? 'Playlist URL'
                  : 'Channel URL or @handle'
            }
            onKeyDown={e => { if (e.key === 'Enter') void addStream(); }}
            style={{
              flex: 1,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              padding: '8px 10px',
              fontSize: 12,
            }}
          />
          <button
            type="button"
            disabled={streamParsing || busy || !streamInput.trim()}
            onClick={() => void addStream()}
            style={{
              borderRadius: 8,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)',
              color: '#fff',
              cursor: streamParsing || busy ? 'wait' : 'pointer',
              opacity: streamParsing || busy || !streamInput.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {streamParsing ? '…' : streamPasteMode === 'video' ? 'Add' : 'Import'}
          </button>
        </div>
      )}

      {streamHint && (
        <p style={{ margin: '0 0 8px', fontSize: 11, color: '#6fcf97' }}>{streamHint}</p>
      )}

      <div style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 8,
      }}
      >
        {stage.streams.length} {stage.streams.length === 1 ? 'video' : 'videos'}
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {stage.streams.map((s, i) => (
          <li
            key={s.videoId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
              padding: '8px 8px 8px 10px',
              borderRadius: 8,
              border: i === stage.nowPlayingIndex
                ? '1px solid rgba(230,126,34,0.5)'
                : '1px solid rgba(255,255,255,0.08)',
              background: i === stage.nowPlayingIndex
                ? 'rgba(230,126,34,0.12)'
                : 'rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button
                type="button"
                disabled={busy || i === 0}
                onClick={() => void moveStream(i, i - 1)}
                aria-label={`Move ${s.title} up`}
                style={sortBtnStyle(busy || i === 0)}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={busy || i === stage.streams.length - 1}
                onClick={() => void moveStream(i, i + 1)}
                aria-label={`Move ${s.title} down`}
                style={sortBtnStyle(busy || i === stage.streams.length - 1)}
              >
                ↓
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.thumbnail}
              alt=""
              width={44}
              height={33}
              style={{ borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div
                title={s.title}
                style={{
                  color: '#fff',
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {truncateWithEllipsis(s.title, 48)}
              </div>
              {s.channelTitle && (
                <div
                  title={s.channelTitle}
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.45)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {truncateWithEllipsis(s.channelTitle, 40)}
                </div>
              )}
            </div>
            {i === stage.nowPlayingIndex ? (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  color: '#ffb347',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'rgba(230,126,34,0.2)',
                  border: '1px solid rgba(230,126,34,0.35)',
                }}
              >
                Now playing
              </span>
            ) : (
              <button
                type="button"
                disabled={busy || playNowIndex !== null}
                onClick={() => void handlePlayNow(i)}
                style={{
                  flexShrink: 0,
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  border: 'none',
                  background: 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)',
                  color: '#fff',
                  cursor: busy || playNowIndex !== null ? 'wait' : 'pointer',
                  opacity: busy || playNowIndex !== null ? 0.55 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {playNowIndex === i ? '…' : 'Play now'}
              </button>
            )}
            <button
              type="button"
              disabled={busy || stage.streams.length <= 1}
              onClick={() => void removeStream(s.videoId)}
              aria-label={`Remove ${s.title}`}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 16,
                cursor: busy || stage.streams.length <= 1 ? 'default' : 'pointer',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#ff6b6b' }}>{error}</p>
      )}
    </section>
  );
}

function sortBtnStyle(disabled: boolean): CSSProperties {
  return {
    width: 22,
    height: 18,
    padding: 0,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
    fontSize: 11,
    lineHeight: 1,
    cursor: disabled ? 'default' : 'pointer',
  };
}
