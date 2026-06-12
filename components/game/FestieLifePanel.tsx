'use client';

import { FestieLifeTimeline } from './FestieLifeTimeline';
import { FestieNotifyEmailSignup } from './FestieNotifyEmailSignup';
import { festieTier } from '@/lib/festie/config';
import { festiePresetById } from '@/lib/festie/presets';
import type { FestieOwner } from '@/lib/festie/types';

type Props = {
  festie: FestieOwner;
  ownerOnline: boolean;
  onUpdated?: (festie: FestieOwner) => void;
  emailInputId?: string;
};

export function FestieLifePanel({
  festie,
  ownerOnline,
  onUpdated,
  emailInputId = 'festie-recap-email',
}: Props) {
  const preset = festiePresetById(festie.preset);
  const tier = festieTier(new Date(festie.last_seen_at));

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif' }}>
      <FestieLifeTimeline
        festieName={festie.name}
        ownerOnline={ownerOnline}
        tier={tier}
        lastSeenAt={festie.last_seen_at}
        glowColor={preset.balloonColor}
      />

      <FestieNotifyEmailSignup
        festie={festie}
        onUpdated={onUpdated}
        inputId={emailInputId}
        variant="panel"
      />
    </div>
  );
}
