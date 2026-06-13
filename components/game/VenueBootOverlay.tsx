'use client';

import { useSyncExternalStore } from 'react';
import {
  LOGO_DISPLAY_HEIGHT,
  LOGO_DISPLAY_WIDTH,
  LOGO_PATH,
  VENUE_BOOT_OVERLAY_ID,
} from '@/lib/site';
import {
  isVenueBootOverlayHidden,
  isVenueBootOverlayHiddenOnServer,
  subscribeVenueBootOverlayHidden,
} from '@/lib/venueBoot';

/** SSR boot shell — paints LCP logo before client JS hydrates. */
export function VenueBootOverlay() {
  const hidden = useSyncExternalStore(
    subscribeVenueBootOverlayHidden,
    isVenueBootOverlayHidden,
    isVenueBootOverlayHiddenOnServer,
  );

  return (
    <div
      id={VENUE_BOOT_OVERLAY_ID}
      className={`venue-boot-overlay${hidden ? ' venue-boot-overlay--hide' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={hidden ? 'false' : 'true'}
      aria-hidden={hidden ? 'true' : undefined}
      aria-label="Loading WhichStage"
    >
      <div className="venue-boot-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_PATH}
          alt="WhichStage"
          className="venue-boot-logo"
          width={LOGO_DISPLAY_WIDTH}
          height={LOGO_DISPLAY_HEIGHT}
          fetchPriority="high"
          decoding="sync"
        />
        <p className="venue-boot-label">Loading…</p>
      </div>
    </div>
  );
}
