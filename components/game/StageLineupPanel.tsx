'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { currentSchedule, getStageSync, subscribeStageSync, syncedNow } from '@/lib/stageClock';
import {
  lineupDisplayForVideo,
  lineupProgressPct,
  lineupQueueProgressPct,
  lineupWaitingSubtitle,
  stageLineupFor,
  type StageLineup,
} from '@/lib/stageLineup';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';
import {
  lineupProgressWithVoteBump,
  readLineupVote,
  writeLineupVote,
} from '@/lib/stageLineupVote';
import { useStageVideoMeta } from './hooks/useStageVideoMeta';

const LINEUP_STYLES = `
@keyframes stage-lineup-eq1 { 0%,100%{transform:scaleY(0.33)} 50%{transform:scaleY(1)} }
@keyframes stage-lineup-eq2 { 0%,100%{transform:scaleY(0.85)} 50%{transform:scaleY(0.4)} }
@keyframes stage-lineup-eq3 { 0%,100%{transform:scaleY(0.5)} 50%{transform:scaleY(1)} }
@keyframes stage-lineup-eq4 { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.55)} }
.stage-lineup-eq-bar {
  width: 3px;
  height: 16px;
  background: #A32D2D;
  border-radius: 2px;
  transform-origin: bottom;
}
`;

type Props = {
  channel: StageChannel;
};

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoveUpButton({
  active = false,
  disabled = false,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={active ? 'Your vote' : 'Move up'}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        padding: 0,
        borderRadius: 5,
        border: active
          ? '1.5px solid rgba(29, 158, 117, 0.75)'
          : '1px solid rgba(255, 255, 255, 0.12)',
        background: active ? 'rgba(29, 158, 117, 0.22)' : 'rgba(255, 255, 255, 0.06)',
        color: active ? '#8ef0c8' : 'rgba(255, 255, 255, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !active ? 0.3 : 1,
        fontFamily: 'inherit',
        flexShrink: 0,
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
      }}
    >
      <ChevronUpIcon />
    </button>
  );
}

function EqBars() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, flexShrink: 0 }}>
      <span className="stage-lineup-eq-bar" style={{ animation: 'stage-lineup-eq1 .9s ease-in-out infinite' }} />
      <span className="stage-lineup-eq-bar" style={{ animation: 'stage-lineup-eq2 .9s ease-in-out infinite' }} />
      <span className="stage-lineup-eq-bar" style={{ animation: 'stage-lineup-eq3 .9s ease-in-out infinite' }} />
      <span className="stage-lineup-eq-bar" style={{ animation: 'stage-lineup-eq4 .9s ease-in-out infinite' }} />
    </div>
  );
}

function Avatar({
  avatarUrl,
  letter,
  channelUrl,
  channelName,
}: {
  avatarUrl?: string;
  letter: string;
  channelUrl?: string;
  channelName: string;
}) {
  const inner = avatarUrl ? (
    <img
      src={avatarUrl}
      alt=""
      width={38}
      height={38}
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  ) : (
    letter
  );

  const shellStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    background: avatarUrl ? 'rgba(255, 255, 255, 0.08)' : '#D3D1C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 500,
    color: '#444441',
  };

  if (!channelUrl) {
    return <div style={shellStyle}>{inner}</div>;
  }

  return (
    <a
      href={channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${channelName} on YouTube`}
      style={{
        ...shellStyle,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
      onClick={e => e.stopPropagation()}
    >
      {inner}
    </a>
  );
}

function LineupRow({
  video,
  meta,
  statusLabel = null,
  playing = false,
  progressPct,
  progressColor = '#888780',
  muted = false,
  voteActive = false,
  voteDisabled = false,
  onVote,
}: {
  video: StageVideo;
  meta?: import('@/lib/stageVideoMeta').StageVideoDisplayMeta;
  statusLabel?: string | null;
  playing?: boolean;
  progressPct?: number;
  progressColor?: string;
  muted?: boolean;
  voteActive?: boolean;
  voteDisabled?: boolean;
  onVote?: () => void;
}) {
  const display = lineupDisplayForVideo(video, meta);
  const detail = statusLabel
    ? `${statusLabel} · ${display.subtitle}`
    : display.subtitle;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        background: muted ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.06)',
        border: playing
          ? '1px solid rgba(255, 255, 255, 0.16)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        padding: '10px 12px',
        opacity: muted ? 0.8 : 1,
      }}
    >
      <Avatar
        avatarUrl={display.avatarUrl}
        letter={display.avatarLetter}
        channelUrl={display.channelUrl}
        channelName={display.name}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: muted ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.9)',
          }}
        >
          {display.name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.45)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: progressPct != null ? 5 : 0,
          }}
        >
          {detail}
        </div>
        {progressPct != null ? (
          <div
            style={{
              height: 5,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: progressColor,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        ) : null}
      </div>
      {playing ? (
        <EqBars />
      ) : (
        <MoveUpButton
          active={voteActive}
          disabled={voteDisabled}
          onClick={onVote}
        />
      )}
    </div>
  );
}

function readLineup(channel: StageChannel): StageLineup | null {
  return stageLineupFor(channel, syncedNow(), getStageSync());
}

export function StageLineupPanel({ channel }: Props) {
  const [lineup, setLineup] = useState<StageLineup | null>(() => readLineup(channel));
  const [votedVideoId, setVotedVideoId] = useState<string | null>(() => readLineupVote(channel));

  const videoIds = useMemo(() => {
    if (!lineup) return [];
    return [lineup.now.video.id, ...lineup.waiting.map(slot => slot.video.id)];
  }, [lineup]);

  const videoMeta = useStageVideoMeta(videoIds);

  useEffect(() => {
    setVotedVideoId(readLineupVote(channel));
  }, [channel]);

  const castVote = useCallback((videoId: string) => {
    if (votedVideoId) return;
    writeLineupVote(channel, videoId);
    setVotedVideoId(videoId);
  }, [channel, votedVideoId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const next = readLineup(channel);
      setLineup(next);
      const sched = currentSchedule(channel);
      if (sched) {
        timer = setTimeout(tick, Math.max(250, sched.msUntilNext) + 50);
      } else {
        timer = setTimeout(tick, 1000);
      }
    };

    tick();
    const unsubscribe = subscribeStageSync(tick);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [channel]);

  if (!lineup) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '14px',
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.45)',
        }}
      >
        No lineup scheduled yet.
      </div>
    );
  }

  const nextProgress = lineupProgressPct(
    lineup.now.slotDurationMs - lineup.now.msUntilNext,
    lineup.now.slotDurationMs,
  );

  return (
    <div
      className="stage-chatter-scroll"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '14px 14px 16px',
      }}
    >
      <style>{LINEUP_STYLES}</style>
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 10,
          lineHeight: 1.45,
          color: 'rgba(255, 255, 255, 0.48)',
        }}
      >
        Decide who plays next on stage. One vote per stage.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <LineupRow
          video={lineup.now.video}
          meta={videoMeta.get(lineup.now.video.id)}
          playing
        />
        {lineup.waiting.map((slot, queueIndex) => {
          const baseProgress = lineupQueueProgressPct(queueIndex, nextProgress);
          const voted = votedVideoId === slot.video.id;
          const voteLocked = votedVideoId != null;

          return (
            <LineupRow
              key={`${slot.index}-${slot.video.id}`}
              video={slot.video}
              meta={videoMeta.get(slot.video.id)}
              statusLabel={lineupWaitingSubtitle(queueIndex, lineup.now.msUntilNext)}
              progressPct={lineupProgressWithVoteBump(baseProgress, voted)}
              progressColor={voted || queueIndex === 0 ? '#1D9E75' : '#888780'}
              voteActive={voted}
              voteDisabled={voteLocked && !voted}
              onVote={() => castVote(slot.video.id)}
            />
          );
        })}
      </div>
      {lineup.moreWaitingCount > 0 ? (
        <button
          type="button"
          style={{
            width: '100%',
            marginTop: 10,
            fontSize: 11,
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: 'rgba(255, 255, 255, 0.55)',
            cursor: 'default',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
  
          {lineup.moreWaitingCount} more waiting
        </button>
      ) : null}
    </div>
  );
}
