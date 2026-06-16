'use client';

import { useOptionalCreatorStage } from '@/lib/stages/CreatorStageContext';
import { creatorStageTrussTitle } from '@/lib/stages/stageDisplayName';
import type { CreatorStageConstants } from './types';

type TrussLabelProps = { tile: number };

export function createCreatorTrussLabel(C: CreatorStageConstants) {
  const cx = C.WHICH_STAGE_MID_X;
  const S = C.WHICH_STAGE_SCALE;
  const pushY = C.WHICH_STAGE_PUSH_Y;
  const ox = cx;
  const oy = C.TENTAROO_GND;
  const trussY = C.WHICH_STAGE_TRUSS_Y ?? 368;
  const titleY = C.WHICH_STAGE_TITLE_Y ?? trussY - 18;
  const isChill = C.idPrefix === 'chill';

  return function CreatorTrussLabel({ tile }: TrussLabelProps) {
    if (isChill) return null;

    const creator = useOptionalCreatorStage();
    const title = creatorStageTrussTitle(creator);
    const glowId = `${C.idPrefix}-truss-glow-${tile}`;

    return (
      <g transform={`translate(0, ${pushY})`}>
        <g transform={`translate(${ox},${oy}) scale(${S}) translate(${-ox},${-oy})`}>
          <text
            x={cx}
            y={titleY}
            textAnchor="middle"
            fontFamily="Anton, Impact, sans-serif"
            fontSize={28}
            letterSpacing={3}
            fill={C.trussTitleFill ?? '#eafff6'}
            filter={`url(#${glowId})`}
          >
            {title}
            <animate attributeName="opacity" values="1;0.88;0.55;0.95;1" dur="5.5s" repeatCount="indefinite" />
          </text>
        </g>
        <defs>
          <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </g>
    );
  };
}
