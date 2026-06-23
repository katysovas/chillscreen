'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Inter } from 'next/font/google';
import { currentSchedule, getStageSync, subscribeStageSync, syncedNow } from '@/lib/stageClock';
import { isMatchupChannel } from '@/lib/matchup/config';
import {
  lineupDisplayForVideo,
  stageLineupFor,
  type StageLineup,
} from '@/lib/stageLineup';
import type { StageChannel } from '@/lib/stageVideos';
import { useStageLineupMultiplayer } from '../StageLineupMultiplayerContext';
import { useStageLineupVotes } from '../hooks/useStageLineupVotes';
import { useStageMatchupVotes } from '../hooks/useStageMatchupVotes';
import { useStageVideoMeta } from '../hooks/useStageVideoMeta';

/** Height reserved below the video inside the headliner foreignObject. */
export const STAGE_VOTE_STRIP_HEIGHT = 66;

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const controlTextBtn: CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 5.5,
  fontWeight: 500,
  letterSpacing: '0.7px',
  textTransform: 'uppercase',
};

const THEME_A = {
  accent: '#8ed4ff',
  heart: '#8ed4ff',
  ink: '#0e2433',
  grad: 'radial-gradient(circle at 38% 32%, #c4e6fb, #5aa6d8)',
};

const THEME_B = {
  accent: '#f0a868',
  heart: '#f0a868',
  ink: '#3a2410',
  grad: 'radial-gradient(circle at 38% 32%, #ffd6ab, #e08a3a)',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const AVATAR_SIZE = 28;
const VOTE_BTN_CLASS = 'stage-vote-strip-btn';

const VOTE_BTN_CSS = `
  .stage-vote-strip-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex-shrink: 0;
    margin-top: 3px;
    padding: 3px 10px;
    min-width: 0;
    border-radius: 999px;
    font-family: inherit;
    font-size: 5px;
    font-weight: 500;
    letter-spacing: 0.55px;
    text-transform: uppercase;
    line-height: 1.2;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.58);
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease,
      transform 0.12s ease,
      box-shadow 0.15s ease;
  }
  .stage-vote-strip-btn:not(:disabled):hover {
    background: color-mix(in srgb, var(--vote-accent) 26%, transparent);
    border-color: color-mix(in srgb, var(--vote-accent) 65%, transparent);
    color: rgba(255,255,255,0.94);
    transform: translateY(-0.5px);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--vote-accent) 28%, transparent);
  }
  .stage-vote-strip-btn[data-voted] {
    background: color-mix(in srgb, var(--vote-accent) 18%, transparent);
    border-color: color-mix(in srgb, var(--vote-accent) 58%, transparent);
    color: rgba(255,255,255,0.92);
  }
  .stage-vote-strip-btn[data-voted]:not(:disabled):hover {
    background: color-mix(in srgb, var(--vote-accent) 32%, transparent);
    border-color: color-mix(in srgb, var(--vote-accent) 72%, transparent);
  }
  .stage-vote-strip-btn:disabled {
    cursor: not-allowed;
  }
  .stage-vote-strip-btn:disabled:not([data-voted]) {
    opacity: 0.45;
  }
  .stage-vote-strip--mobile .stage-vote-strip-btn {
    margin-top: 0;
    gap: 6px;
    padding: 9px 14px;
    min-height: 36px;
    font-size: 9px;
    letter-spacing: 0.45px;
  }
  .stage-vote-info-tip {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  }
  .stage-vote-info-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 10px;
    height: 10px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: rgba(255,255,255,0.34);
    cursor: help;
    line-height: 0;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .stage-vote-info-tip:hover .stage-vote-info-btn,
  .stage-vote-info-tip:focus-within .stage-vote-info-btn {
    color: var(--vote-accent);
    background: color-mix(in srgb, var(--vote-accent) 14%, transparent);
  }
  .stage-vote-info-popover {
    position: absolute;
    z-index: 20;
    bottom: calc(100% + 5px);
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    max-width: min(140px, 36vw);
    padding: 4px 6px;
    border-radius: 4px;
    background: rgba(12, 14, 20, 0.96);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 6px 18px rgba(0,0,0,0.45);
    font-family: inherit;
    font-size: 5px;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 1.35;
    text-transform: none;
    color: rgba(255,255,255,0.82);
    white-space: normal;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
  }
  .stage-vote-strip--mobile .stage-vote-info-popover {
    max-width: min(200px, 44vw);
    padding: 6px 8px;
    font-size: 8px;
    line-height: 1.4;
    bottom: calc(100% + 6px);
  }
  .stage-vote-info-tip[data-align="end"] .stage-vote-info-popover {
    left: auto;
    right: 0;
    transform: none;
  }
  .stage-vote-info-tip[data-align="start"] .stage-vote-info-popover {
    left: 0;
    transform: none;
  }
  .stage-vote-info-tip:hover .stage-vote-info-popover,
  .stage-vote-info-tip:focus-within .stage-vote-info-popover {
    opacity: 1;
    visibility: visible;
  }
`;
const rowFlex: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flex: '1 1 0%',
  minHeight: 0,
};

type Props = {
  channel: StageChannel;
  width?: number | '100%';
  layout?: 'embedded' | 'mobile';
};

function readLineup(channel: StageChannel): StageLineup | null {
  return stageLineupFor(channel, syncedNow(), getStageSync());
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function HeartIcon({ filled, color, size = 6 }: { filled: boolean; color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path d="M12 20.5 4.3 13a4.6 4.6 0 0 1 6.5-6.5l1.2 1.2 1.2-1.2A4.6 4.6 0 1 1 19.7 13Z" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon({ size = 7 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
      style={{ display: 'block' }}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChannelInfoTip({
  description,
  theme,
  align,
}: {
  description?: string;
  theme: typeof THEME_A;
  align: 'start' | 'end';
}) {
  if (!description?.trim()) return null;

  return (
    <span
      className="stage-vote-info-tip"
      data-align={align}
      style={{ '--vote-accent': theme.accent } as CSSProperties}
    >
      <button
        type="button"
        className="stage-vote-info-btn"
        aria-label="Channel description"
        tabIndex={0}
        onClick={e => e.stopPropagation()}
      >
        <InfoIcon size={7} />
      </button>
      <span className="stage-vote-info-popover" role="tooltip">
        {description}
      </span>
    </span>
  );
}

function CreatorOption({
  display,
  theme,
  voted,
  disabled,
  onVote,
  avatarSide = 'start',
  columnSide = 'left',
  voteLabel = 'Vote',
  layout = 'embedded',
}: {
  display: ReturnType<typeof lineupDisplayForVideo>;
  theme: typeof THEME_A;
  voted: boolean;
  disabled: boolean;
  onVote: () => void;
  avatarSide?: 'start' | 'end';
  /** Which half of the vote strip — controls info popover direction. */
  columnSide?: 'left' | 'right';
  voteLabel?: string;
  layout?: 'embedded' | 'mobile';
}) {
  const heartSize = layout === 'mobile' ? 9 : 6;
  const voteButton = (
    <button
      type="button"
      className={VOTE_BTN_CLASS}
      data-voted={voted || undefined}
      onClick={onVote}
      disabled={disabled}
      aria-pressed={voted}
      aria-label={voted ? `Voted ${voteLabel}` : voteLabel}
      style={{ '--vote-accent': theme.accent } as CSSProperties}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: heartSize,
          height: heartSize,
          flexShrink: 0,
        }}
      >
        <HeartIcon filled={voted} color={theme.heart} size={heartSize} />
      </span>
      <span style={{ display: 'block', lineHeight: 1, transform: 'translateY(0.25px)' }}>
        {voted ? '✓' : voteLabel}
      </span>
    </button>
  );

  const avatarInner = display.avatarUrl ? (
    <img
      src={display.avatarUrl}
      alt=""
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  ) : (
    display.avatarLetter.toUpperCase()
  );

  const avatarShellStyle: CSSProperties = {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    flexShrink: 0,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: display.avatarUrl ? 'rgba(255,255,255,0.08)' : theme.grad,
    color: theme.ink,
    fontSize: 11,
    fontWeight: 700,
    alignSelf: 'center',
    textDecoration: 'none',
  };

  const avatar = display.channelUrl ? (
    <a
      href={display.channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${display.name} on YouTube`}
      onClick={e => e.stopPropagation()}
      style={{
        ...avatarShellStyle,
        cursor: 'pointer',
      }}
    >
      {avatarInner}
    </a>
  ) : (
    <div style={avatarShellStyle}>{avatarInner}</div>
  );

  const nameRow = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        maxWidth: '100%',
        flexDirection: 'row',
        justifyContent: layout === 'mobile' ? 'center' : undefined,
      }}
    >
      <span
        style={{
          fontSize: layout === 'mobile' ? 7.5 : 6.5,
          fontWeight: 500,
          lineHeight: 1.15,
          color: 'rgba(255,255,255,0.88)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
          textAlign: layout === 'mobile' ? 'center' : undefined,
        }}
      >
        {display.name}
      </span>
      <ChannelInfoTip
        description={display.channelDescription}
        theme={theme}
        align={columnSide === 'right' ? 'end' : 'start'}
      />
    </div>
  );

  if (layout === 'mobile') {
    return (
      <div
        style={{
          flex: '1 1 0%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          overflow: 'visible',
        }}
      >
        {avatar}
        {nameRow}
        {voteButton}
      </div>
    );
  }

  const copy = (
    <div
      style={{
        flex: '1 1 0%',
        minWidth: 0,
        alignSelf: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: avatarSide === 'end' ? 'flex-end' : 'flex-start',
        gap: 0,
      }}
    >
      {nameRow}
      {voteButton}
    </div>
  );

  return (
    <div style={{ ...rowFlex, flex: '1 1 0%', minWidth: 0, overflow: 'visible' }}>
      {avatarSide === 'end' ? (
        <>
          {copy}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {copy}
        </>
      )}
    </div>
  );
}

export function StageVoteStrip({ channel, width = 440, layout = 'embedded' }: Props) {
  const mp = useStageLineupMultiplayer();
  const matchupMode = isMatchupChannel(channel);
  const [lineup, setLineup] = useState<StageLineup | null>(() => (
    matchupMode ? null : readLineup(channel)
  ));
  const [lineupCountdown, setLineupCountdown] = useState('');
  const lineupVotes = useStageLineupVotes(channel, matchupMode ? null : mp);
  const matchupVotes = useStageMatchupVotes(channel, matchupMode ? mp : null);

  const optionA = matchupMode
    ? (matchupVotes.holderDisplay ? { video: { id: 'a', title: matchupVotes.holderDisplay.name } } : null)
    : (lineup?.waiting[0] ?? null);
  const optionB = matchupMode
    ? (matchupVotes.challengerDisplay ? { video: { id: 'b', title: matchupVotes.challengerDisplay.name } } : null)
    : (lineup?.waiting[1] ?? null);

  const videoIds = useMemo(() => {
    if (matchupMode) return [];
    const ids: string[] = [];
    if (optionA && 'index' in optionA) ids.push(optionA.video.id);
    if (optionB && 'index' in optionB) ids.push(optionB.video.id);
    return ids;
  }, [matchupMode, optionA, optionB]);

  const videoMeta = useStageVideoMeta(videoIds);

  useEffect(() => {
    if (matchupMode) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let countdownTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const next = readLineup(channel);
      setLineup(next);
      if (next) {
        setLineupCountdown(formatCountdown(next.now.msUntilNext));
      }
      const sched = currentSchedule(channel);
      if (sched) {
        timer = setTimeout(tick, Math.max(250, sched.msUntilNext) + 50);
      } else {
        timer = setTimeout(tick, 1000);
      }
    };

    tick();
    countdownTimer = setInterval(() => {
      const next = readLineup(channel);
      if (next) setLineupCountdown(formatCountdown(next.now.msUntilNext));
    }, 1000);

    const unsubscribe = subscribeStageSync(tick);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (countdownTimer) clearInterval(countdownTimer);
      unsubscribe();
    };
  }, [channel, matchupMode]);

  if (matchupMode) {
    if (!matchupVotes.challengerDisplay || !matchupVotes.holderDisplay) return null;
  } else if (!lineup || !optionA || !optionB) {
    return null;
  }

  const displayA = matchupMode
    ? matchupVotes.holderDisplay!
    : lineupDisplayForVideo(optionA!.video, videoMeta.get(optionA!.video.id));
  const displayB = matchupMode
    ? matchupVotes.challengerDisplay!
    : lineupDisplayForVideo(optionB!.video, videoMeta.get(optionB!.video.id));

  const pctA = matchupMode ? matchupVotes.pctA : (() => {
    const countA = lineupVotes.voteState.counts[optionA!.video.id] ?? 0;
    const countB = lineupVotes.voteState.counts[optionB!.video.id] ?? 0;
    const totalVotes = countA + countB;
    return totalVotes === 0 ? 50 : Math.round((countA / totalVotes) * 100);
  })();
  const pctB = 100 - pctA;
  const voteBarBackground = `linear-gradient(90deg, #5aa6d8 0%, #8ed4ff ${pctA}%, #f0a868 ${pctA}%, #e08a3a 100%)`;

  const votedA = matchupMode
    ? (matchupVotes.isSuperAdmin ? false : matchupVotes.myVote === 'a')
    : lineupVotes.voteState.myVote === optionA!.video.id;
  const votedB = matchupMode
    ? (matchupVotes.isSuperAdmin ? false : matchupVotes.myVote === 'b')
    : lineupVotes.voteState.myVote === optionB!.video.id;

  const voteReady = matchupMode
    ? matchupVotes.canVote
    : lineupVotes.connected && lineupVotes.sessionReady;
  const voteDisabled = matchupMode
    ? !voteReady
    : !voteReady || lineupVotes.voteLocked;

  const countdown = matchupMode
    ? formatCountdown(matchupVotes.msUntilNext)
    : lineupCountdown;

  const onVoteA = () => {
    if (matchupMode) matchupVotes.castVote('a');
    else lineupVotes.castVote(optionA!.video.id);
  };
  const onVoteB = () => {
    if (matchupMode) matchupVotes.castVote('b');
    else lineupVotes.castVote(optionB!.video.id);
  };

  const shell: CSSProperties = {
    boxSizing: 'border-box',
    width,
    height: layout === 'mobile' ? 'auto' : STAGE_VOTE_STRIP_HEIGHT,
    minHeight: layout === 'mobile' ? 120 : undefined,
    padding: layout === 'mobile' ? '6px 10px 7px' : '4px 8px 5px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflow: 'visible',
    background: 'linear-gradient(165deg, rgba(18,22,32,0.94) 0%, rgba(10,12,18,0.96) 100%)',
    borderTop: layout === 'mobile' ? 'none' : '1px solid rgba(255,255,255,0.08)',
    borderBottom: layout === 'mobile' ? '1px solid rgba(255,255,255,0.08)' : 'none',
    color: 'rgba(255,255,255,0.9)',
    WebkitFontSmoothing: 'antialiased',
  };

  return (
    <section
      aria-label="Vote for the next stream"
      className={`${inter.className}${layout === 'mobile' ? ' stage-vote-strip--mobile' : ''}`}
      style={shell}
    >
      <style>{VOTE_BTN_CSS}</style>
      <div
        style={{
          ...controlTextBtn,
          fontSize: 6,
          color: 'rgba(255,255,255,0.42)',
          textAlign: 'center',
          lineHeight: 1,
          paddingTop: 2,
          paddingBottom: 1,
        }}
      >
        Vote who&apos;s playing next
      </div>

      <div style={{ ...rowFlex, alignItems: 'center', overflow: 'visible' }}>
        <CreatorOption
          display={displayA}
          theme={THEME_A}
          voted={votedA}
          disabled={voteDisabled}
          avatarSide="end"
          columnSide="left"
          voteLabel={matchupMode ? 'keep playing' : 'Vote'}
          layout={layout}
          onVote={onVoteA}
        />

        <div style={{ flex: '1 1 0%', minWidth: 0, maxWidth: layout === 'mobile' ? undefined : 132 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              marginBottom: 2,
            }}
          >
            <span style={{ fontSize: 7, fontWeight: 600, color: THEME_A.accent, lineHeight: 1 }}>{pctA}%</span>
            <span
              style={{
                ...controlTextBtn,
                fontSize: 5,
                color: 'rgba(255,255,255,0.35)',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {countdown}
            </span>
            <span style={{ fontSize: 7, fontWeight: 600, color: THEME_B.accent, lineHeight: 1 }}>{pctB}%</span>
          </div>

          <div
            style={{
              height: 3,
              borderRadius: 999,
              background: voteBarBackground,
              transition: `background 550ms ${EASE}`,
            }}
            aria-hidden
          />
        </div>

        <CreatorOption
          display={displayB}
          theme={THEME_B}
          voted={votedB}
          disabled={voteDisabled}
          columnSide="right"
          voteLabel={matchupMode ? 'play next' : 'Vote'}
          layout={layout}
          onVote={onVoteB}
        />
      </div>
    </section>
  );
}
