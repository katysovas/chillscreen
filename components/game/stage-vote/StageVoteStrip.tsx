'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { currentSchedule, getStageSync, subscribeStageSync, syncedNow } from '@/lib/stageClock';
import {
  lineupDisplayForVideo,
  stageLineupFor,
  type StageLineup,
} from '@/lib/stageLineup';
import type { StageChannel } from '@/lib/stageVideos';
import { useStageLineupMultiplayer } from '../StageLineupMultiplayerContext';
import { useStageLineupVotes } from '../hooks/useStageLineupVotes';
import { useStageVideoMeta } from '../hooks/useStageVideoMeta';

/** Height reserved below the video inside the headliner foreignObject. */
export const STAGE_VOTE_STRIP_HEIGHT = 136;

const COLOR_A = '#8ed4ff';
const COLOR_B = '#f0a868';

type Props = {
  channel: StageChannel;
  width?: number;
};

function readLineup(channel: StageChannel): StageLineup | null {
  return stageLineupFor(channel, syncedNow(), getStageSync());
}

const shell: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  padding: '8px 12px 9px',
  background: '#121318',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: 'rgba(255,255,255,0.92)',
  WebkitFontSmoothing: 'antialiased',
};

function VoteAvatar({
  avatarUrl,
  letter,
  ringColor,
}: {
  avatarUrl?: string;
  letter: string;
  ringColor: string;
}) {
  const style: CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: avatarUrl ? 'rgba(255,255,255,0.08)' : '#d8d5cc',
    fontSize: 13,
    fontWeight: 600,
    color: '#444441',
    textDecoration: 'none',
    boxShadow: `0 0 0 2px ${ringColor}`,
  };

  const inner = avatarUrl ? (
    <img
      src={avatarUrl}
      alt=""
      width={34}
      height={34}
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  ) : (
    letter
  );

  return <div style={style} aria-hidden>{inner}</div>;
}

function VoteOption({
  label,
  display,
  active,
  disabled,
  accent,
  onVote,
}: {
  label: string;
  display: ReturnType<typeof lineupDisplayForVideo>;
  active: boolean;
  disabled: boolean;
  accent: string;
  onVote: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onVote}
      disabled={disabled}
      aria-pressed={active}
      aria-label={`Vote for ${display.name}`}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 9px',
        borderRadius: 9,
        border: active
          ? `1.5px solid ${accent}`
          : '1px solid rgba(255,255,255,0.12)',
        background: active ? `${accent}22` : 'rgba(255,255,255,0.05)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !active ? 0.55 : 1,
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'inherit',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
    >
      <VoteAvatar
        avatarUrl={display.avatarUrl}
        letter={display.avatarLetter}
        ringColor={active ? accent : 'rgba(255,255,255,0.14)'}
      />
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: 2,
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {display.name}
        </span>
      </span>
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: active ? accent : 'rgba(255,255,255,0.1)',
          color: active ? '#0d1118' : 'rgba(255,255,255,0.7)',
          fontSize: 12,
        }}
      >
        ♥
      </span>
    </button>
  );
}

export function StageVoteStrip({ channel, width }: Props) {
  const mp = useStageLineupMultiplayer();
  const [lineup, setLineup] = useState<StageLineup | null>(() => readLineup(channel));
  const {
    voteState,
    castVote,
    connected,
    sessionReady,
    voteLocked,
  } = useStageLineupVotes(channel, mp);

  const optionA = lineup?.waiting[0] ?? null;
  const optionB = lineup?.waiting[1] ?? null;

  const videoIds = useMemo(() => {
    const ids: string[] = [];
    if (optionA) ids.push(optionA.video.id);
    if (optionB) ids.push(optionB.video.id);
    return ids;
  }, [optionA, optionB]);

  const videoMeta = useStageVideoMeta(videoIds);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setLineup(readLineup(channel));
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

  if (!lineup || !optionA || !optionB) return null;

  const displayA = lineupDisplayForVideo(optionA.video, videoMeta.get(optionA.video.id));
  const displayB = lineupDisplayForVideo(optionB.video, videoMeta.get(optionB.video.id));

  const countA = voteState.counts[optionA.video.id] ?? 0;
  const countB = voteState.counts[optionB.video.id] ?? 0;
  const totalVotes = countA + countB;
  const pctA = totalVotes === 0 ? 50 : (countA / totalVotes) * 100;

  const votedA = voteState.myVote === optionA.video.id;
  const votedB = voteState.myVote === optionB.video.id;
  const voteReady = connected && sessionReady;
  const voteDisabled = !voteReady || voteLocked;

  const statusLabel = !voteReady
    ? 'Connecting…'
    : voteLocked
      ? 'Vote locked'
      : 'Tap to vote';

  return (
    <section
      aria-label="Vote for the next stream"
      style={{
        ...shell,
        ...(width != null ? { width } : {}),
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Vote what&apos;s next
        </span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)' }}>{statusLabel}</span>
      </div>

      <div
        style={{
          position: 'relative',
          height: 14,
          borderRadius: 7,
          background: COLOR_B,
          marginBottom: 9,
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pctA}%`,
            background: COLOR_A,
            transition: 'width 0.4s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${pctA}%`,
            top: '50%',
            width: 11,
            height: 11,
            marginTop: -5.5,
            marginLeft: -5.5,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 0 0 2px rgba(9,10,15,0.55)',
            transition: 'left 0.4s ease',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          fontSize: 9,
          color: 'rgba(255,255,255,0.42)',
        }}
      >
        <span>
          <strong style={{ color: COLOR_A, fontWeight: 600 }}>{Math.round(pctA)}%</strong>
          {' · '}
          {countA} {countA === 1 ? 'vote' : 'votes'}
        </span>
        <span>
          <strong style={{ color: COLOR_B, fontWeight: 600 }}>{Math.round(100 - pctA)}%</strong>
          {' · '}
          {countB} {countB === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <VoteOption
          label="Option A"
          display={displayA}
          active={votedA}
          disabled={voteDisabled}
          accent={COLOR_A}
          onVote={() => castVote(optionA.video.id)}
        />
        <VoteOption
          label="Option B"
          display={displayB}
          active={votedB}
          disabled={voteDisabled}
          accent={COLOR_B}
          onVote={() => castVote(optionB.video.id)}
        />
      </div>
    </section>
  );
}
