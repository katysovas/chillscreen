'use client';

import { useMemo, useState } from 'react';
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
  getFeaturedStagesChartTabs,
  type FeaturedChartEntry,
} from '@/lib/stages/featuredStagesChart';
import { useCreatorChartMeta } from './useCreatorChartMeta';
import { StageChartRow } from './StageChartRow';
import {
  STAGE_CHART_INFO,
  STAGE_CHART_MOVE,
  STAGE_CHART_MOVE_DOWN,
  STAGE_CHART_MOVE_SAME,
  STAGE_CHART_MOVE_UP,
  STAGE_CHART_NAME,
  STAGE_CHART_SUBTITLE,
  STAGE_CHART_BODY,
  STAGE_CHART_JOIN,
  STAGE_CHART_JOIN_DISABLED,
  STAGE_CHART_MODAL,
  STAGE_CHART_THUMB,
  STAGE_CHART_THUMB_IMG,
  stageChartRankStyle,
} from './stageChartRowStyles';
import './FeaturedStagesChart.css';

export type FeaturedStagesChartProps = {
  onSelect: (target: StagePickerTarget) => void;
  /** Highlight a picked row (modal flow). */
  selectedId?: string | null;
  /** Mark the stage the user is already on. */
  currentId?: string | null;
  /** Per-row join button — homepage uses this; switch modal joins directly. */
  showJoinAction?: boolean;
  joinLabel?: string;
  /** Hide billboard rank movement arrows (up/down). */
  showRankMovement?: boolean;
  /** When set, join button calls this instead of only decorating the row. */
  onJoin?: (target: StagePickerTarget) => void;
  /** Tighter layout + scroll for modals. */
  variant?: 'page' | 'modal';
  /** Hide built-in header when the parent supplies section chrome. */
  showHeader?: boolean;
  /** Genre tabs — defaults to match showHeader; set true on homepage with showHeader false. */
  showTabs?: boolean;
  /** Render list only — parent supplies outer chart chrome (switch modal tabs). */
  embedded?: boolean;
  /** Controlled chart tab (Featured, Chill, EDM, …). */
  chartTabId?: string;
  onChartTabChange?: (tabId: string) => void;
  className?: string;
};

function MoveIndicator({ entry }: { entry: FeaturedChartEntry }) {
  const move = chartMovement(entry.rank, entry.previousRank);
  if (move === 'up') {
    return (
      <span className="featured-stages-chart__move featured-stages-chart__move--up" style={STAGE_CHART_MOVE_UP} aria-label="Moved up">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 11V3M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (move === 'down') {
    return (
      <span className="featured-stages-chart__move featured-stages-chart__move--down" style={STAGE_CHART_MOVE_DOWN} aria-label="Moved down">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 3v8M4 8l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="featured-stages-chart__move featured-stages-chart__move--same" style={STAGE_CHART_MOVE_SAME} aria-label="No change">
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
  showRankMovement = true,
  onJoin,
  variant = 'page',
  showHeader = true,
  showTabs,
  embedded = false,
  chartTabId: chartTabIdProp,
  onChartTabChange,
  className = '',
}: FeaturedStagesChartProps) {
  const chartTabs = useMemo(() => getFeaturedStagesChartTabs(), []);
  const [internalTabId, setInternalTabId] = useState('featured');
  const activeTabId = chartTabIdProp ?? internalTabId;
  const tab = useMemo(() => getFeaturedStagesChartTab(activeTabId), [activeTabId]);
  const creatorMeta = useCreatorChartMeta(tab.entries);

  const selectTab = (tabId: string) => {
    if (chartTabIdProp == null) setInternalTabId(tabId);
    onChartTabChange?.(tabId);
  };
  const isModal = variant === 'modal';
  const tabsVisible = showTabs ?? showHeader;

  const tabBar = tabsVisible ? (
    <div className="featured-stages-chart__tabs" role="tablist" aria-label="Chart genres">
      {chartTabs.map(chartTab => (
        <button
          key={chartTab.id}
          type="button"
          role="tab"
          aria-selected={chartTab.id === activeTabId}
          className={[
            'featured-stages-chart__tab',
            chartTab.id === activeTabId ? 'featured-stages-chart__tab--active' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => selectTab(chartTab.id)}
        >
          {chartTab.label}
        </button>
      ))}
    </div>
  ) : null;

  const resolveEntry = (entry: FeaturedChartEntry) => {
    const slug = creatorStageForChartEntry(entry);
    const stage = slug ? creatorMeta.get(slug) : undefined;
    return {
      name: resolvedChartEntryName(entry, stage),
      subtitle: resolvedChartEntrySubtitle(entry, stage),
      thumbnail: resolvedChartEntryThumbnail(entry, stage),
    };
  };

  const list = (
    <div
      className="featured-stages-chart__body"
      role="list"
      style={isModal ? STAGE_CHART_BODY : undefined}
    >
      {tab.entries.map(entry => {
          const id = chartEntryId(entry);
          const display = resolveEntry(entry);
          const selected = selectedId === id;
          const current = currentId === id;
          const isCurrent = current;
          const rowClass = [
            'featured-stages-chart__row',
            !showJoinAction ? 'featured-stages-chart__row--no-action' : '',
            selected ? 'featured-stages-chart__row--selected' : '',
            current ? 'featured-stages-chart__row--current' : '',
          ].filter(Boolean).join(' ');

          const joinControl = showJoinAction ? (
            onJoin ? (
              <button
                type="button"
                className="featured-stages-chart__join"
                style={{
                  ...STAGE_CHART_JOIN,
                  ...(isCurrent ? STAGE_CHART_JOIN_DISABLED : {}),
                }}
                disabled={isCurrent}
                onClick={e => {
                  e.stopPropagation();
                  if (!isCurrent) onJoin(entry.target);
                }}
              >
                {joinLabel}
                <JoinArrow />
              </button>
            ) : (
              <span className="featured-stages-chart__join">
                {joinLabel}
                <JoinArrow />
              </span>
            )
          ) : null;

          return (
            <div key={id} role="listitem">
              <StageChartRow
                className={rowClass}
                selected={selected}
                current={current}
                onClick={() => onSelect(entry.target)}
              >
                <span className="featured-stages-chart__rank" style={stageChartRankStyle(entry.rank)}>{entry.rank}</span>
                <div className="featured-stages-chart__thumb" style={STAGE_CHART_THUMB}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={display.thumbnail}
                    alt=""
                    loading="lazy"
                    style={STAGE_CHART_THUMB_IMG}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="featured-stages-chart__info" style={STAGE_CHART_INFO}>
                  <p className="featured-stages-chart__name" style={STAGE_CHART_NAME}>{display.name}</p>
                  {display.subtitle ? (
                    <p className="featured-stages-chart__subtitle" style={STAGE_CHART_SUBTITLE}>{display.subtitle}</p>
                  ) : null}
                </div>
                {joinControl}
                {showRankMovement && (
                  <span style={STAGE_CHART_MOVE}>
                    <MoveIndicator entry={entry} />
                  </span>
                )}
              </StageChartRow>
            </div>
          );
        })}
    </div>
  );

  if (embedded) return list;

  return (
    <div
      className={[
        'featured-stages-chart',
        isModal ? 'featured-stages-chart--modal featured-stages-chart--scrollable' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={isModal ? STAGE_CHART_MODAL : undefined}
    >
      {showHeader && (
        <div className="featured-stages-chart__header">
          <div className="featured-stages-chart__title-block">
            <p className="featured-stages-chart__eyebrow">Featured Stages</p>
            <h2 className="featured-stages-chart__title" id="mobile-stage-swap-chart-title">Top 10</h2>
          </div>
          {tabBar}
        </div>
      )}
      {!showHeader && tabBar ? (
        <div className="featured-stages-chart__tabs-row">{tabBar}</div>
      ) : null}
      {list}
    </div>
  );
}
