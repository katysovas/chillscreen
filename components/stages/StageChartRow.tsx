'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import {
  STAGE_CHART_ROW,
  STAGE_CHART_ROW_CURRENT,
  STAGE_CHART_ROW_INNER,
  STAGE_CHART_ROW_SELECTED,
} from './stageChartRowStyles';

type Props = {
  className: string;
  selected?: boolean;
  current?: boolean;
  onClick: () => void;
  children: ReactNode;
};

/** Chart list row — div + inline flex (Safari breaks layout inside <button>). */
export function StageChartRow({ className, selected, current, onClick, children }: Props) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const rowStyle = {
    ...STAGE_CHART_ROW,
    ...(selected ? STAGE_CHART_ROW_SELECTED : current ? STAGE_CHART_ROW_CURRENT : {}),
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={className}
      style={rowStyle}
      aria-pressed={selected || undefined}
      aria-current={current ? 'true' : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className="featured-stages-chart__row-inner" style={STAGE_CHART_ROW_INNER}>
        {children}
      </div>
    </div>
  );
}
