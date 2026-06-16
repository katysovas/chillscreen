import type { HTMLAttributes } from 'react';
import {
  DEEP_SPACE_HEIGHT,
  DEEP_SPACE_SCALE,
  DEEP_SPACE_WIDTH,
} from '@/lib/stageVideoLayout';
import { STAGE_ANCHOR_Y } from '@/lib/stageLayout';
import { STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';
import { WHICH_STAGE_MID_X } from '../chill/constants';
import { CreatorSpaceShell, CreatorSpaceStage } from './CreatorSpaceStage';

type Props = { live: boolean };

/** Deep Space stage rig on creator tiles — same layout as /space. */
export function CreatorSpaceStageBlock({ live }: Props) {
  const cx = WHICH_STAGE_MID_X;
  const foW = DEEP_SPACE_WIDTH * DEEP_SPACE_SCALE;
  const foH = DEEP_SPACE_HEIGHT * DEEP_SPACE_SCALE;
  const foY = STAGE_ANCHOR_Y - foH;

  return (
    <>
      <g>
        <ellipse
          cx={cx}
          cy={670}
          rx={foW / 2 + 24}
          ry={22}
          fill="rgba(54,224,200,.06)"
        />
        <ellipse
          cx={cx}
          cy={674}
          rx={foW / 2 + 10}
          ry={8}
          fill="rgba(54,224,200,.14)"
        />
      </g>
      <foreignObject
        x={cx - foW / 2}
        y={foY}
        width={foW}
        height={foH}
        data-stage-video-fo={live ? true : undefined}
        style={live ? STAGE_VIDEO_FO_STYLE : { overflow: 'visible' }}
      >
        <div
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
          style={{
            width: DEEP_SPACE_WIDTH,
            transform: `scale(${DEEP_SPACE_SCALE})`,
            transformOrigin: 'top left',
            ...(live ? STAGE_VIDEO_WRAPPER_STYLE : { pointerEvents: 'none' }),
          }}
        >
          {live ? <CreatorSpaceStage live /> : <CreatorSpaceShell />}
        </div>
      </foreignObject>
    </>
  );
}
