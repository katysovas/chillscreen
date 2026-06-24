'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import {
  STAGE_CHART_ROW_INNER,
  stageChartRowStyle,
  type StageChartTheme,
} from './stageChartRowStyles';

type Props = {
  className: string;
  theme?: StageChartTheme;
  selected?: boolean;
  current?: boolean;
  onClick: () => void;
  children: ReactNode;
};

/** Chart list row — div + inline flex (Safari breaks layout inside <button>). */
export function StageChartRow({
  className,
  theme = 'page',
  selected,
  current,
  onClick,
  children,
}: Props) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={className}
      style={stageChartRowStyle(theme, { selected, current })}
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
