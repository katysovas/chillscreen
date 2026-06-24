'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StagePickerTarget } from '@/lib/stagePickerOptions';
import { stagePickerTargetId } from '@/lib/stagePickerOptions';
import { fetchMyStages } from '@/lib/stages/client';
import type { UserStagePublic } from '@/lib/stages/types';
import { displayForOwnedStage } from '@/lib/stages/chartEntryDisplay';
import { getFeaturedStagesChartTabs } from '@/lib/stages/featuredStagesChart';
import { FeaturedStagesChart } from './FeaturedStagesChart';
import { StageChartRow } from './StageChartRow';
import {
  STAGE_CHART_BODY,
  STAGE_CHART_INFO_LAYOUT,
  STAGE_CHART_JOIN_DISABLED,
  STAGE_CHART_MODAL,
  STAGE_CHART_SWITCH_HEADER,
  STAGE_CHART_TABBAR,
  STAGE_CHART_THUMB_IMG,
  stageChartJoinStyle,
  stageChartNameStyle,
  stageChartSubtitleStyle,
  stageChartThumbStyle,
  stageChartSwitchTabStyle,
} from './stageChartRowStyles';
import './FeaturedStagesChart.css';

export type SwitchStagesTab = string;

type Props = {
  selectedId?: string | null;
  currentId?: string | null;
  onSelect: (target: StagePickerTarget) => void;
  onJoin: (target: StagePickerTarget) => void;
  joinLabel?: string;
  titleId?: string;
};

/** Switch-stage modal — chart tabs (Featured + genres) + optional My Stages. */
export function SwitchStagesChart({
  selectedId = null,
  currentId = null,
  onSelect,
  onJoin,
  joinLabel = 'Join the stage',
  titleId = 'switch-stages-chart-title',
}: Props) {
  const chartTabs = useMemo(() => getFeaturedStagesChartTabs(), []);
  const [activeTab, setActiveTab] = useState<SwitchStagesTab>('featured');
  const [myStages, setMyStages] = useState<UserStagePublic[] | null>(null);
  const showMineTab = (myStages?.length ?? 0) > 0;

  useEffect(() => {
    let cancelled = false;
    void fetchMyStages()
      .then(stages => {
        if (!cancelled) setMyStages(stages);
      })
      .catch(() => {
        if (!cancelled) setMyStages([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!showMineTab && activeTab === 'mine') {
      setActiveTab('featured');
    }
  }, [activeTab, showMineTab]);

  const isMine = activeTab === 'mine';

  return (
    <div
      className="featured-stages-chart featured-stages-chart--modal featured-stages-chart--switch featured-stages-chart--scrollable"
      style={STAGE_CHART_MODAL}
    >
      <span id={titleId} className="featured-stages-chart__sr-only">Switch stage</span>

      <div className="featured-stages-chart__switch-header" style={STAGE_CHART_SWITCH_HEADER}>
        <div
          className="featured-stages-chart__tabbar"
          role="tablist"
          aria-label="Stage lists"
          style={STAGE_CHART_TABBAR}
        >
          {chartTabs.map(tab => {
            const active = !isMine && activeTab === tab.id;
            return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={[
                'featured-stages-chart__switch-tab',
                active ? 'featured-stages-chart__switch-tab--active' : '',
              ].filter(Boolean).join(' ')}
              style={stageChartSwitchTabStyle(active)}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
            );
          })}
          {showMineTab && (
            <button
              type="button"
              role="tab"
              aria-selected={isMine}
              className={[
                'featured-stages-chart__switch-tab',
                isMine ? 'featured-stages-chart__switch-tab--active' : '',
              ].filter(Boolean).join(' ')}
              style={stageChartSwitchTabStyle(isMine)}
              onClick={() => setActiveTab('mine')}
            >
              My Stages
            </button>
          )}
        </div>
      </div>

      {!isMine ? (
        <FeaturedStagesChart
          variant="modal"
          showHeader={false}
          embedded
          chartTabId={activeTab}
          selectedId={selectedId}
          currentId={currentId}
          showJoinAction
          joinLabel={joinLabel}
          showRankMovement={false}
          onSelect={onSelect}
          onJoin={onJoin}
        />
      ) : (
        <div className="featured-stages-chart__body" role="list" style={STAGE_CHART_BODY}>
          {(myStages ?? []).map(stage => {
            const id = stagePickerTargetId({ kind: 'creator', slug: stage.slug });
            const display = displayForOwnedStage(stage);
            const selected = selectedId === id;
            const current = currentId === id;
            const rowClass = [
              'featured-stages-chart__row',
              'featured-stages-chart__row--owned',
              selected ? 'featured-stages-chart__row--selected' : '',
              current ? 'featured-stages-chart__row--current' : '',
            ].filter(Boolean).join(' ');
            const target = { kind: 'creator' as const, slug: stage.slug };

            return (
              <div key={id} role="listitem">
                <StageChartRow
                  className={rowClass}
                  theme="modal"
                  selected={selected}
                  current={current}
                  onClick={() => onSelect(target)}
                >
                  <div className="featured-stages-chart__thumb" style={stageChartThumbStyle('modal')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={display.thumbnail}
                      alt=""
                      loading="lazy"
                      style={STAGE_CHART_THUMB_IMG}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div className="featured-stages-chart__info" style={STAGE_CHART_INFO_LAYOUT}>
                    <p className="featured-stages-chart__name" style={stageChartNameStyle('modal')}>{display.name}</p>
                    {display.subtitle ? (
                      <p className="featured-stages-chart__subtitle" style={stageChartSubtitleStyle('modal')}>{display.subtitle}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="featured-stages-chart__join"
                    style={{
                      ...stageChartJoinStyle('modal'),
                      ...(current ? STAGE_CHART_JOIN_DISABLED : {}),
                    }}
                    disabled={current}
                    onClick={e => {
                      e.stopPropagation();
                      if (!current) onJoin(target);
                    }}
                  >
                    {joinLabel}
                  </button>
                </StageChartRow>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
