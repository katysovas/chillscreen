'use client';

import { useMemo } from 'react';
import type { StagePickerTarget } from '@/lib/stagePickerOptions';
import {
  resolvedChartEntryName,
  resolvedChartEntrySubtitle,
  resolvedChartEntryThumbnail,
  creatorStageForChartEntry,
} from '@/lib/stages/chartEntryDisplay';
import {
  chartEntryId,
  chartMovement,
  getFeaturedStagesChartTab,
  type FeaturedChartEntry,
} from '@/lib/stages/featuredStagesChart';
import { useCreatorChartMeta } from './useCreatorChartMeta';
import './FeaturedStagesChart.css';

export type FeaturedStagesChartProps = {
  onSelect: (target: StagePickerTarget) => void;
  /** Highlight a picked row (modal flow). */
  selectedId?: string | null;
  /** Mark the stage the user is already on. */
  currentId?: string | null;
  /** Per-row join button — homepage uses this; modals rely on row pick + submit. */
  showJoinAction?: boolean;
  joinLabel?: string;
  /** Tighter layout + scroll for modals. */
  variant?: 'page' | 'modal';
  /** Hide built-in header when the parent supplies section chrome. */
  showHeader?: boolean;
  className?: string;
};

function MoveIndicator({ entry }: { entry: FeaturedChartEntry }) {
  const move = chartMovement(entry.rank, entry.previousRank);
  if (move === 'up') {
    return (
      <span className="featured-stages-chart__move featured-stages-chart__move--up" aria-label="Moved up">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 11V3M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (move === 'down') {
    return (
      <span className="featured-stages-chart__move featured-stages-chart__move--down" aria-label="Moved down">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 3v8M4 8l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="featured-stages-chart__move featured-stages-chart__move--same" aria-label="No change">
      —
    </span>
  );
}

function JoinArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Billboard-style top 10 — shared by homepage and switch-stage modals. */
export function FeaturedStagesChart({
  onSelect,
  selectedId = null,
  currentId = null,
  showJoinAction = false,
  joinLabel = 'Join',
  variant = 'page',
  showHeader = true,
  className = '',
}: FeaturedStagesChartProps) {
  const tab = useMemo(() => getFeaturedStagesChartTab(), []);
  const creatorMeta = useCreatorChartMeta(tab.entries);
  const isModal = variant === 'modal';

  const resolveEntry = (entry: FeaturedChartEntry) => {
    const slug = creatorStageForChartEntry(entry);
    const stage = slug ? creatorMeta.get(slug) : undefined;
    return {
      name: resolvedChartEntryName(entry, stage),
      subtitle: resolvedChartEntrySubtitle(entry, stage),
      thumbnail: resolvedChartEntryThumbnail(entry, stage),
    };
  };

  return (
    <div
      className={[
        'featured-stages-chart',
        isModal ? 'featured-stages-chart--modal featured-stages-chart--scrollable' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {showHeader && (
        <div className="featured-stages-chart__header">
          <div className="featured-stages-chart__title-block">
            <p className="featured-stages-chart__eyebrow">Featured Stages</p>
            <h2 className="featured-stages-chart__title" id="mobile-stage-swap-chart-title">Top 10</h2>
          </div>
          <div className="featured-stages-chart__tabs" role="tablist" aria-label="Chart genres">
            <span
              className="featured-stages-chart__tab featured-stages-chart__tab--active"
              role="tab"
              aria-selected
            >
              {tab.label}
            </span>
          </div>
        </div>
      )}

      <div className="featured-stages-chart__body" role="list">
        {tab.entries.map(entry => {
          const id = chartEntryId(entry);
          const display = resolveEntry(entry);
          const selected = selectedId === id;
          const current = currentId === id;
          const rowClass = [
            'featured-stages-chart__row',
            !showJoinAction ? 'featured-stages-chart__row--no-action' : '',
            selected ? 'featured-stages-chart__row--selected' : '',
            current ? 'featured-stages-chart__row--current' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={id} role="listitem">
              <button
                type="button"
                className={rowClass}
                aria-pressed={selected || undefined}
                aria-current={current ? 'true' : undefined}
                onClick={() => onSelect(entry.target)}
              >
                <span className="featured-stages-chart__rank">{entry.rank}</span>
                <div className="featured-stages-chart__thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={display.thumbnail}
                    alt=""
                    loading="lazy"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="featured-stages-chart__info">
                  <p className="featured-stages-chart__name">{display.name}</p>
                  {display.subtitle ? (
                    <p className="featured-stages-chart__subtitle">{display.subtitle}</p>
                  ) : null}
                </div>
                {showJoinAction && (
                  <span className="featured-stages-chart__join">
                    {joinLabel}
                    <JoinArrow />
                  </span>
                )}
                <MoveIndicator entry={entry} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
