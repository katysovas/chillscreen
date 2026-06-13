'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Z_SESSION_RECAP } from '@/lib/zLayers';
import { FestieSessionRecapModal } from './FestieSessionRecapModal';
import type { FestieOwner } from '@/lib/festie/types';
import type { FestieSessionRecap } from '@/lib/festie/sessionRecap';

type Props = {
  festie: FestieOwner;
  festieName: string;
  recap: FestieSessionRecap;
  isMobile: boolean;
  forceShowEmailSignup?: boolean;
  onFestieUpdated?: (festie: FestieOwner) => void;
  onDismiss: () => void;
};

export function FestieSessionRecapOverlay({
  festie,
  festieName,
  recap,
  isMobile,
  forceShowEmailSignup = false,
  onFestieUpdated,
  onDismiss,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={`festie-recap-backdrop${isMobile ? ' festie-recap-backdrop--mobile' : ''}`}
        data-paraloid-ui
        style={{ zIndex: Z_SESSION_RECAP }}
        onClick={onDismiss}
        aria-hidden
      />
      <div
        className={`festie-recap-anchor${isMobile ? ' festie-recap-anchor--mobile' : ''}`}
        data-paraloid-ui
        style={{ zIndex: Z_SESSION_RECAP + 1 }}
      >
        <FestieSessionRecapModal
          festieName={festieName}
          festiePreset={festie.preset}
          festie={festie}
          onFestieUpdated={onFestieUpdated}
          recap={recap}
          onDismiss={onDismiss}
          isMobile={isMobile}
          forceShowEmailSignup={forceShowEmailSignup}
        />
      </div>
    </>,
    document.body,
  );
}
