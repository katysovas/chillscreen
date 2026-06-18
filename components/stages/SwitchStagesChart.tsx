'use client';

import { useEffect, useState } from 'react';
import type { StagePickerTarget } from '@/lib/stagePickerOptions';
import { stagePickerTargetId } from '@/lib/stagePickerOptions';
import { fetchMyStages } from '@/lib/stages/client';
import type { UserStagePublic } from '@/lib/stages/types';
import { displayForOwnedStage } from '@/lib/stages/chartEntryDisplay';
import { FeaturedStagesChart } from './FeaturedStagesChart';
import './FeaturedStagesChart.css';

export type SwitchStagesTab = 'featured' | 'mine';

type Props = {
  selectedId?: string | null;
  currentId?: string | null;
  onSelect: (target: StagePickerTarget) => void;
  titleId?: string;
};

/** Switch-stage modal — Featured top 10 + optional My Stages tab. */
export function SwitchStagesChart({
  selectedId = null,
  currentId = null,
  onSelect,
  titleId = 'switch-stages-chart-title',
}: Props) {
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

  return (
    <div className="featured-stages-chart featured-stages-chart--modal featured-stages-chart--switch featured-stages-chart--scrollable">
      <span id={titleId} className="featured-stages-chart__sr-only">Switch stage</span>

      {showMineTab && (
        <div className="featured-stages-chart__switch-header">
          <div className="featured-stages-chart__tabbar" role="tablist" aria-label="Stage lists">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'featured'}
              className={[
                'featured-stages-chart__switch-tab',
                activeTab === 'featured' ? 'featured-stages-chart__switch-tab--active' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setActiveTab('featured')}
            >
              Featured
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'mine'}
              className={[
                'featured-stages-chart__switch-tab',
                activeTab === 'mine' ? 'featured-stages-chart__switch-tab--active' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setActiveTab('mine')}
            >
              My Stages
            </button>
          </div>
        </div>
      )}

      {activeTab === 'featured' ? (
        <FeaturedStagesChart
          variant="modal"
          showHeader={false}
          embedded
          selectedId={selectedId}
          currentId={currentId}
          onSelect={onSelect}
        />
      ) : (
        <div className="featured-stages-chart__body" role="list">
          {(myStages ?? []).map(stage => {
            const id = stagePickerTargetId({ kind: 'creator', slug: stage.slug });
            const display = displayForOwnedStage(stage);
            const selected = selectedId === id;
            const current = currentId === id;
            const rowClass = [
              'featured-stages-chart__row',
              'featured-stages-chart__row--owned',
              'featured-stages-chart__row--no-action',
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
                  onClick={() => onSelect({ kind: 'creator', slug: stage.slug })}
                >
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
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
