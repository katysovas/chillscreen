'use client';

import { useMemo } from 'react';
import { StageSocialLinkIcon } from '@/components/stages/StageSocialLinkIcon';
import { useStageChannel } from '@/lib/stageClock';
import { lineupDisplayForVideo } from '@/lib/stageLineup';
import { isMatchupChannel } from '@/lib/matchup/config';
import type { StageVideo } from '@/lib/stageVideos';
import { youtubeThumbnailUrl } from '@/lib/stagePlaylistUtils';
import { useOptionalCreatorStage } from '@/lib/stages/CreatorStageContext';
import {
  STAGE_SOCIAL_LINK_FIELDS,
  stageSocialLinkDisplayLabel,
  type StageSocialLinkKind,
} from '@/lib/stages/socialLinks';
import type { StageChannel } from '@/lib/stageVideos';
import { DISCORD_URL } from '@/lib/site';
import { CABANA_DISCORD_LOGO } from '@/lib/cabanas';
import { useMatchupStagePlayback } from './hooks/useMatchupStagePlayback';
import { useStageVideoMeta } from './hooks/useStageVideoMeta';

const PANEL_STYLES = `
@keyframes stage-info-eq1 { 0%,100%{transform:scaleY(0.33)} 50%{transform:scaleY(1)} }
@keyframes stage-info-eq2 { 0%,100%{transform:scaleY(0.85)} 50%{transform:scaleY(0.4)} }
@keyframes stage-info-eq3 { 0%,100%{transform:scaleY(0.5)} 50%{transform:scaleY(1)} }
@keyframes stage-info-eq4 { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.55)} }
.stage-info-eq-bar {
  display: block;
  width: 3px;
  height: 100%;
  border-radius: 2px;
  background: rgba(255, 140, 200, 0.9);
  transform-origin: bottom;
}
`;

export type StageInfoLink = {
  id: string;
  kind: StageSocialLinkKind;
  label: string;
  href: string;
};

type Props = {
  stageName?: string;
  stageDescription?: string | null;
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

function EqBars() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14, flexShrink: 0 }}>
      <span className="stage-info-eq-bar" style={{ animation: 'stage-info-eq1 .9s ease-in-out infinite' }} />
      <span className="stage-info-eq-bar" style={{ animation: 'stage-info-eq2 .9s ease-in-out infinite' }} />
      <span className="stage-info-eq-bar" style={{ animation: 'stage-info-eq3 .9s ease-in-out infinite' }} />
      <span className="stage-info-eq-bar" style={{ animation: 'stage-info-eq4 .9s ease-in-out infinite' }} />
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
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
      {children}
    </div>
  );
}

function SuggestArtistDiscord() {
  return (
    <div style={{ marginBottom: 14, textAlign: 'center' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.42)',
          marginBottom: 6,
        }}
      >
        Suggest artist
      </div>
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          borderRadius: 9,
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CABANA_DISCORD_LOGO}
          alt=""
          width={18}
          height={14}
          aria-hidden
          style={{ display: 'block', flexShrink: 0 }}
        />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Join our Discord</span>
        <span aria-hidden style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.38)' }}>↗</span>
      </a>
    </div>
  );
}

function NowPlayingCard({
  video,
  meta,
}: {
  video: StageVideo;
  meta?: import('@/lib/stageVideoMeta').StageVideoDisplayMeta;
}) {
  const display = lineupDisplayForVideo(video, meta);
  const bannerUrl = video.thumbnailUrl || youtubeThumbnailUrl(video.id);
  const videoTitle = meta?.videoTitle?.trim() || video.title.trim();
  const channelDescription = meta?.channelDescription?.trim() || '';

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(255, 140, 200, 0.28)',
        background: 'linear-gradient(155deg, rgba(255, 120, 200, 0.12) 0%, rgba(120, 100, 255, 0.08) 100%)',
        boxShadow: 'inset 0 0 20px rgba(255, 120, 200, 0.06)',
        overflow: 'hidden',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerUrl}
        alt=""
        width={320}
        height={120}
        style={{
          width: '100%',
          height: 96,
          objectFit: 'cover',
          display: 'block',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      />
      <div style={{ padding: '12px 12px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid rgba(255, 255, 255, 0.14)',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={display.avatarUrl}
              alt=""
              width={40}
              height={40}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
              }}
            >
              {display.channelUrl ? (
                <a
                  href={display.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(255, 240, 250, 0.95)',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {display.name}
                </a>
              ) : (
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(255, 240, 250, 0.95)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {display.name}
                </div>
              )}
              <EqBars />
            </div>
            {display.followersLabel ? (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.48)',
                }}
              >
                {display.followersLabel} subscribers
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.45,
            color: 'rgba(255, 255, 255, 0.88)',
            marginBottom: channelDescription ? 8 : 0,
          }}
        >
          {videoTitle}
        </div>

        {channelDescription ? (
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 10,
              lineHeight: 1.55,
              color: 'rgba(255, 255, 255, 0.52)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {channelDescription}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function StageInfoPanel({
  stageName,
  stageDescription,
  playbackChannel = null,
}: Props) {
  const creatorStage = useOptionalCreatorStage();
  const matchupChannel = playbackChannel && isMatchupChannel(playbackChannel);
  const matchupPlayback = useMatchupStagePlayback(
    playbackChannel ?? 'deep-space',
    Boolean(matchupChannel),
  );
  const curatedPlayback = useStageChannel(
    playbackChannel ?? 'deep-space',
    Boolean(playbackChannel && !matchupChannel),
  );

  const activeVideo = useMemo((): StageVideo | null => {
    if (creatorStage) {
      const stream = creatorStage.streams[creatorStage.nowPlayingIndex];
      if (!stream) return null;
      return {
        id: stream.videoId,
        title: stream.title,
        channelTitle: stream.channelTitle,
        thumbnailUrl: stream.thumbnail,
      };
    }
    if (!playbackChannel) return null;
    if (matchupChannel) {
      return matchupPlayback?.video ?? null;
    }
    return curatedPlayback.video ?? null;
  }, [
    creatorStage,
    creatorStage?.nowPlayingIndex,
    creatorStage?.streams,
    playbackChannel,
    matchupChannel,
    matchupPlayback?.video,
    curatedPlayback.video,
  ]);

  const activeVideoId = activeVideo?.id ?? null;
  const videoMeta = useStageVideoMeta(activeVideoId ? [activeVideoId] : []);

  const links = useMemo((): StageInfoLink[] => {
    const out: StageInfoLink[] = [];
    const stored = creatorStage?.socialLinks ?? {};

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

    return out;
  }, [creatorStage?.socialLinks]);

  const infoName = stageName?.trim() ?? '';
  const infoDescription = stageDescription?.trim() ?? '';
  const hasStageInfo = Boolean(infoName || infoDescription);
  const hasContent = hasStageInfo || links.length > 0 || activeVideo;

  return (
    <>
      <style>{PANEL_STYLES}</style>

      {infoName ? (
        <h2
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.35,
            color: 'rgba(255, 240, 250, 0.95)',
          }}
        >
          {infoName}
        </h2>
      ) : null}

      {infoDescription ? (
        <p
          style={{
            margin: infoName ? '10px 0 0' : 0,
            fontSize: 11,
            lineHeight: 1.55,
            color: 'rgba(255, 255, 255, 0.72)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {infoDescription}
        </p>
      ) : null}

      {links.length > 0 ? (
        <div style={{ marginTop: hasStageInfo ? 16 : 0 }}>
          <SectionLabel>Links</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {links.map(link => (
              <StageInfoLinkRow key={link.id} link={link} />
            ))}
          </div>
        </div>
      ) : null}

      {activeVideo ? (
        <div style={{ marginTop: hasStageInfo || links.length > 0 ? 18 : 0 }}>
          {!creatorStage ? <SuggestArtistDiscord /> : null}
          <SectionLabel>Now Playing</SectionLabel>
          <NowPlayingCard video={activeVideo} meta={videoMeta.get(activeVideo.id)} />
        </div>
      ) : null}

      {!hasContent ? (
        <p
          style={{
            margin: '12px 4px 0',
            fontSize: 11,
            lineHeight: 1.5,
            color: 'rgba(255, 255, 255, 0.38)',
          }}
        >
          No stage information yet.
        </p>
      ) : null}
    </>
  );
}
