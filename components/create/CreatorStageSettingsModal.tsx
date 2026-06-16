'use client';

import { useState } from 'react';
import { useCreatorStageControls } from '@/lib/stages/CreatorStageContext';
import { CreatorStageModalShell } from './CreatorStageModalShell';
import { CreatorStageLineupPanel } from './CreatorStageLineupPanel';
import { CreatorStageScenePanel } from './CreatorStageScenePanel';

type Props = {
  onClose: () => void;
};

type SettingsTab = 'stage' | 'lineup';

export function CreatorStageSettingsModal({ onClose }: Props) {
  const ctx = useCreatorStageControls();
  const [tab, setTab] = useState<SettingsTab>('stage');

  if (!ctx?.isOwner) return null;

  return (
    <CreatorStageModalShell
      title="Stage settings"
      ariaLabel="Stage settings"
      onClose={onClose}
    >
      <div
        role="tablist"
        aria-label="Stage settings sections"
        style={{ display: 'flex', gap: 8, marginBottom: 16 }}
      >
        {([
          { id: 'stage' as const, label: 'Stage settings' },
          { id: 'lineup' as const, label: 'Lineup' },
        ]).map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 600,
                border: active
                  ? '1px solid rgba(230,126,34,0.5)'
                  : '1px solid rgba(255,255,255,0.1)',
                background: active ? 'rgba(230,126,34,0.16)' : 'rgba(255,255,255,0.04)',
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" hidden={tab !== 'stage'}>
        {tab === 'stage' && <CreatorStageScenePanel />}
      </div>

      <div role="tabpanel" hidden={tab !== 'lineup'}>
        {tab === 'lineup' && <CreatorStageLineupPanel />}
      </div>
    </CreatorStageModalShell>
  );
}
