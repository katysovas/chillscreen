'use client';

import { useMemo } from 'react';
import { useStageChannel } from '@/lib/stageClock';
import { lineupTitleLabel } from '@/lib/stageLineup';
import { resolveStageVideoDisplayMeta } from '@/lib/stageVideoMeta';
import { useOptionalCreatorStage } from '@/lib/stages/CreatorStageContext';
import {
  STAGE_SOCIAL_LINK_FIELDS,
  stageSocialLinkDisplayLabel,
  type StageSocialLinkKind,
} from '@/lib/stages/socialLinks';
import type { StageChannel } from '@/lib/stageVideos';
import { useStageVideoMeta } from './hooks/useStageVideoMeta';

export type StageInfoLink = {
  id: string;
  kind: StageSocialLinkKind | 'youtube-channel';
  label: string;
  href: string;
};

type Props = {
  /** Built-in venue playback channel — omit on creator stages. */
  playbackChannel?: StageChannel | null;
};

function YouTubeLogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
      <path
        fill="#FF0033"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
      />
      <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function XLogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
      <path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramLogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="stage-info-ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f9ce34" />
          <stop offset="50%" stopColor="#ee2a7b" />
          <stop offset="100%" stopColor="#6228d7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#stage-info-ig)" />
      <circle cx="12" cy="12" r="4.25" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1.2" fill="#fff" />
    </svg>
  );
}

function SoundCloudLogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
      <path
        fill="#FF5500"
        d="M17.5 10.2c-.3 0-.6.1-.8.2-.2-2.1-2-3.8-4.2-3.8-1.2 0-2.3.5-3.1 1.3-.2.2-.2.5 0 .7l.2.2c.2.2.5.2.7 0 .6-.6 1.4-1 2.2-1 1.6 0 2.9 1.2 3.1 2.8-.4.2-.7.6-.7 1.1v.2c0 .7.5 1.2 1.2 1.2H18c1.1 0 2-.9 2-2s-.9-2-2-2h-.5zM4.5 12.8c-.3 0-.5.2-.5.5v2.4c0 .3.2.5.5.5s.5-.2.5-.5v-2.4c0-.3-.2-.5-.5-.5zm2 0c-.3 0-.5.2-.5.5v2.4c0 .3.2.5.5.5s.5-.2.5-.5v-2.4c0-.3-.2-.5-.5-.5zm2 0c-.3 0-.5.2-.5.5v2.4c0 .3.2.5.5.5s.5-.2.5-.5v-2.4c0-.3-.2-.5-.5-.5zm2-.4c-.3 0-.5.2-.5.5v2.8c0 .3.2.5.5.5s.5-.2.5-.5v-2.8c0-.3-.2-.5-.5-.5zm2-.6c-.3 0-.5.2-.5.5v3.4c0 .3.2.5.5.5s.5-.2.5-.5v-3.4c0-.3-.2-.5-.5-.5z"
      />
    </svg>
  );
}

function TikTokLogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
      <path
        fill="#fff"
        d="M16.6 5.82c.92.66 2.04 1.05 3.25 1.05V9.4c-1.18 0-2.28-.35-3.2-.95v6.78c0 3.45-2.8 6.25-6.25 6.25S4.15 18.68 4.15 15.23c0-3.45 2.8-6.25 6.25-6.25.34 0 .67.03 1 .08v3.45a3.2 3.2 0 0 0-1-.16c-1.77 0-3.2 1.43-3.2 3.2s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2V2.25h2.8c.08.98.5 1.86 1.2 2.57z"
      />
    </svg>
  );
}

function WebsiteLogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.72)" strokeWidth="1.6" />
      <path d="M3 12h18M12 3c2.8 3.1 2.8 14.9 0 18M12 3c-2.8 3.1-2.8 14.9 0 18" stroke="rgba(255,255,255,0.72)" strokeWidth="1.4" />
    </svg>
  );
}

function SocialLinkIcon({ kind }: { kind: StageInfoLink['kind'] }) {
  switch (kind) {
    case 'youtube':
    case 'youtube-channel':
      return <YouTubeLogoIcon />;
    case 'x':
      return <XLogoIcon />;
    case 'instagram':
      return <InstagramLogoIcon />;
    case 'soundcloud':
      return <SoundCloudLogoIcon />;
    case 'tiktok':
      return <TikTokLogoIcon />;
    case 'website':
      return <WebsiteLogoIcon />;
    default:
      return <WebsiteLogoIcon />;
  }
}

function StageInfoLinkRow({ link }: { link: StageInfoLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.06)',
        color: 'rgba(255, 255, 255, 0.9)',
        textDecoration: 'none',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }}
    >
      <SocialLinkIcon kind={link.kind} />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {link.label}
      </span>
      <span
        aria-hidden
        style={{
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.38)',
          flexShrink: 0,
        }}
      >
        ↗
      </span>
    </a>
  );
}

export function StageInfoPanel({ playbackChannel = null }: Props) {
  const creatorStage = useOptionalCreatorStage();
  const curatedPlayback = useStageChannel(
    playbackChannel ?? 'deep-space',
    Boolean(playbackChannel),
  );

  const activeVideoId = useMemo(() => {
    if (creatorStage) {
      return creatorStage.streams[creatorStage.nowPlayingIndex]?.videoId ?? null;
    }
    if (playbackChannel) {
      return curatedPlayback.video?.id ?? null;
    }
    return null;
  }, [
    creatorStage,
    creatorStage?.nowPlayingIndex,
    creatorStage?.streams,
    playbackChannel,
    curatedPlayback.video?.id,
  ]);

  const activeStream = useMemo(() => {
    if (!creatorStage || !activeVideoId) return null;
    return creatorStage.streams[creatorStage.nowPlayingIndex] ?? null;
  }, [creatorStage, activeVideoId]);

  const videoMeta = useStageVideoMeta(activeVideoId ? [activeVideoId] : []);

  const links = useMemo((): StageInfoLink[] => {
    const out: StageInfoLink[] = [];
    const stored = creatorStage?.socialLinks ?? {};
    const hasStoredYoutube = Boolean(stored.youtube?.trim());

    for (const field of STAGE_SOCIAL_LINK_FIELDS) {
      const href = stored[field.kind]?.trim();
      if (!href) continue;
      out.push({
        id: `social-${field.kind}`,
        kind: field.kind,
        label: stageSocialLinkDisplayLabel(field.kind, href),
        href,
      });
    }

    if (!hasStoredYoutube && activeVideoId) {
      const fetched = videoMeta.get(activeVideoId);
      const display = resolveStageVideoDisplayMeta(
        {
          id: activeVideoId,
          title: activeStream?.title ?? fetched?.videoTitle ?? '',
          channelTitle: activeStream?.channelTitle,
          thumbnailUrl: activeStream?.thumbnail,
        },
        fetched,
      );
      if (display.channelUrl) {
        out.unshift({
          id: `youtube-channel-${activeVideoId}`,
          kind: 'youtube-channel',
          label: lineupTitleLabel(display.channelTitle, 36),
          href: display.channelUrl,
        });
      }
    }

    return out;
  }, [creatorStage?.socialLinks, activeVideoId, activeStream, videoMeta]);

  if (!links.length) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          margin: '0 0 8px',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.42)',
        }}
      >
        Links
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {links.map(link => (
          <StageInfoLinkRow key={link.id} link={link} />
        ))}
      </div>
    </div>
  );
}
