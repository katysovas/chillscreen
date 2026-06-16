'use client';

import { useRef } from 'react';
import { useOptionalCreatorStage } from '@/lib/stages/CreatorStageContext';
import { nowPlayingStream } from '@/lib/stages/runtime';
import { streamChannelMarquee } from '@/lib/stages/streamLabel';
import { creatorStageTrussTitle } from '@/lib/stages/stageDisplayName';
import { stageChannelForVenueKind } from '@/lib/venues';
import { DeepSpaceView } from '../../DeepSpaceStage';
import { useStagePlayer } from '../../useStagePlayer';
import { StageVideoFrame } from '../../StageVideoFrame';

const IFRAME_W = 540;
const IFRAME_H = 304;

function useCreatorSpaceLabels() {
  const creator = useOptionalCreatorStage();
  const stream = creator ? nowPlayingStream(creator) : null;
  const signTitle = creatorStageTrussTitle(creator);
  const videoTitle = stream ? streamChannelMarquee(stream) : 'Cosmic Drift';
  return { signTitle, videoTitle };
}

/** Static Deep Space facade for creator templates. */
export function CreatorSpaceShell() {
  const { signTitle, videoTitle } = useCreatorSpaceLabels();

  return (
    <DeepSpaceView
      signTitle={signTitle}
      videoTitle={videoTitle}
      screen={
        <div
          className="ds-iframe"
          style={{ width: IFRAME_W, height: IFRAME_H, background: '#030508' }}
        />
      }
    />
  );
}

function CreatorSpaceLive() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { signTitle, videoTitle } = useCreatorSpaceLabels();
  const { video, src, vidKey, onIframeLoad } = useStagePlayer({
    live: true,
    channel: stageChannelForVenueKind('which-stage', 0),
    iframeRef,
  });

  return (
    <DeepSpaceView
      signTitle={signTitle}
      videoTitle={videoTitle}
      titleKey={vidKey}
      screen={
        video && src ? (
          <StageVideoFrame
            iframeRef={iframeRef}
            src={src}
            vidKey={vidKey}
            title={video.title}
            onIframeLoad={onIframeLoad}
            width={IFRAME_W}
            height={IFRAME_H}
          />
        ) : (
          <div
            className="ds-iframe"
            style={{ width: IFRAME_W, height: IFRAME_H, background: '#030508' }}
          />
        )
      }
    />
  );
}

export function CreatorSpaceStage({ live = false }: { live?: boolean }) {
  if (!live) return <CreatorSpaceShell />;
  return <CreatorSpaceLive />;
}
