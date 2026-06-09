import type { StageChannel } from './stageVideos';

export type StageChannelMeta = {
  id: StageChannel;
  label: string;
  description: string;
};

/** Display metadata for admin UI and docs. */
export const STAGE_CHANNEL_META: StageChannelMeta[] = [
  { id: 'cinema', label: 'Chill Cinema', description: 'San Francisco outdoor cinema' },
  { id: 'outside-lands', label: 'San Francisco', description: 'Outside Hands concert stage' },
  { id: 'edc', label: 'Las Vegas', description: 'EDC main stage' },
  { id: 'coachella', label: 'The Desert', description: 'Southern California festival stage' },
  { id: 'which-stage', label: 'The Farm', description: 'Which Stage — Bonnaroo-style main rig' },
  { id: 'forest', label: 'The Forest', description: 'The Forest Stage — glowing woods main rig' },
  { id: 'bumbershoot', label: 'Seattle', description: 'Seattle outdoor concert stage' },
];

export const STAGE_CHANNEL_IDS = STAGE_CHANNEL_META.map(c => c.id);

export function stageChannelLabel(id: StageChannel): string {
  return STAGE_CHANNEL_META.find(c => c.id === id)?.label ?? id;
}
