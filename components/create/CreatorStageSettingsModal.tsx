'use client';

import { useState } from 'react';
import { useCreatorStageControls } from '@/lib/stages/CreatorStageContext';
import { CreatorStageModalShell } from './CreatorStageModalShell';
import { CreatorStageLineupPanel } from './CreatorStageLineupPanel';
import { CreatorStageScenePanel } from './CreatorStageScenePanel';

type Props = {
  onClose: () => void;
};

type StageEditTab = 'lineup' | 'scene';

const TAB_STYLE = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'transparent',
  color: 'rgba(255,255,255,0.65)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
} as const;

/** Stage owner or super admin — edit lineup and scene from the bottom control panel. */
export function CreatorStageLineupModal({ onClose }: Props) {
  const ctx = useCreatorStageControls();
  const [tab, setTab] = useState<StageEditTab>('lineup');

  if (!ctx?.canManageLineup) return null;

  const title = tab === 'lineup' ? 'Lineup' : 'Scene';

  return (
    <CreatorStageModalShell
      title={title}
      ariaLabel="Stage settings"
      onClose={onClose}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setTab('lineup')}
          style={{
            ...TAB_STYLE,
            background: tab === 'lineup' ? 'rgba(230,126,34,0.18)' : TAB_STYLE.background,
            borderColor: tab === 'lineup' ? 'rgba(230,126,34,0.45)' : TAB_STYLE.border,
            color: tab === 'lineup' ? '#fff' : TAB_STYLE.color,
          }}
        >
          Lineup
        </button>
        <button
          type="button"
          onClick={() => setTab('scene')}
          style={{
            ...TAB_STYLE,
            background: tab === 'scene' ? 'rgba(230,126,34,0.18)' : TAB_STYLE.background,
            borderColor: tab === 'scene' ? 'rgba(230,126,34,0.45)' : TAB_STYLE.border,
            color: tab === 'scene' ? '#fff' : TAB_STYLE.color,
          }}
        >
          Scene
        </button>
      </div>
      {tab === 'lineup' ? <CreatorStageLineupPanel /> : <CreatorStageScenePanel />}
    </CreatorStageModalShell>
  );
}

/** @deprecated Use CreatorStageLineupModal */
export function CreatorStageSettingsModal({ onClose }: Props) {
  return <CreatorStageLineupModal onClose={onClose} />;
}
