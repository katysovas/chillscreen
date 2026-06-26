'use client';

import { StagePlaylistAdmin } from '@/components/admin/StagePlaylistAdmin';
import { CreatorStageModalShell } from '@/components/create/CreatorStageModalShell';
import { STAGE_CHANNEL_META } from '@/lib/stageChannelLabels';
import type { StageChannel } from '@/lib/stageVideos';

type Props = {
  channel: StageChannel;
  onClose: () => void;
};

/** Super admin — edit built-in stage playlists in-game. */
export function BuiltInStagePlaylistModal({ channel, onClose }: Props) {
  const label = STAGE_CHANNEL_META.find(meta => meta.id === channel)?.label ?? channel;

  return (
    <CreatorStageModalShell
      title={`${label} playlist`}
      ariaLabel={`${label} playlist editor`}
      onClose={onClose}
      width={960}
    >
      <StagePlaylistAdmin initialChannel={channel} embedded />
    </CreatorStageModalShell>
  );
}
