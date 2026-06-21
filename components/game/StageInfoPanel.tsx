'use client';

import { useMemo } from 'react';
import { StageSocialLinkIcon } from '@/components/stages/StageSocialLinkIcon';
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

function SocialLinkIcon({ kind }: { kind: StageInfoLink['kind'] }) {
  return <StageSocialLinkIcon kind={kind} size={18} />;
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
