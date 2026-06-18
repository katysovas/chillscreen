'use client';

import { useCreatorStageControls } from '@/lib/stages/CreatorStageContext';
import { CreatorStageModalShell } from './CreatorStageModalShell';
import { CreatorStageLineupPanel } from './CreatorStageLineupPanel';

type Props = {
  onClose: () => void;
};

/** Stage owner — edit lineup from the bottom control panel. */
export function CreatorStageLineupModal({ onClose }: Props) {
  const ctx = useCreatorStageControls();

  if (!ctx?.isOwner) return null;

  return (
    <CreatorStageModalShell
      title="Lineup"
      ariaLabel="Stage lineup"
      onClose={onClose}
    >
      <CreatorStageLineupPanel />
    </CreatorStageModalShell>
  );
}

/** @deprecated Use CreatorStageLineupModal */
export function CreatorStageSettingsModal({ onClose }: Props) {
  return <CreatorStageLineupModal onClose={onClose} />;
}
