import type { VenueRoute } from '@/lib/venueRoutes';

const STORAGE_KEY = 'whichstage-mobile-lounge';

/** Narrow / touch-primary — matches mobile game controls breakpoint. */
export function isMobileLoungeDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

export function getStoredMobileLoungeStage(): VenueRoute | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return raw as VenueRoute;
  } catch {
    return null;
  }
}

export function setStoredMobileLoungeStage(route: VenueRoute): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, route);
  } catch {
    /* private mode */
  }
}

export type MobileLoungeStageOption = {
  route: VenueRoute;
  title: string;
  tagline: string;
  /** Zoom the full scene so the stage (incl. video screen) fits the phone. */
  scale: number;
  /** transform-origin Y — keep sky visible above the stage. */
  originYPercent: number;
};

/** Pickable destinations for mobile lounge (no walking — stage-focused). */
export const MOBILE_LOUNGE_STAGES: MobileLoungeStageOption[] = [
  {
    route: 'outside-hands',
    title: 'San Francisco',
    tagline: 'Outdoor concert stage',
    scale: 1.12,
    originYPercent: 55,
  },
  {
    route: 'seattle-concerts',
    title: 'Seattle',
    tagline: 'Emerald City stage',
    scale: 1.1,
    originYPercent: 55,
  },
  {
    route: 'coachella',
    title: 'The Desert',
    tagline: 'Festival main stage',
    scale: 1.06,
    originYPercent: 57,
  },
  {
    route: 'edc',
    title: 'Las Vegas',
    tagline: 'Electric Daze',
    scale: 1.04,
    originYPercent: 58,
  },
  {
    route: 'tentaroo',
    title: 'The Farm',
    tagline: 'Which Stage',
    scale: 1.08,
    originYPercent: 57,
  },
  {
    route: 'cinema',
    title: 'Chill Cinema',
    tagline: 'Outdoor screen',
    scale: 1.05,
    originYPercent: 54,
  },
];

export function mobileLoungeStageOption(route: VenueRoute): MobileLoungeStageOption {
  return MOBILE_LOUNGE_STAGES.find(s => s.route === route) ?? MOBILE_LOUNGE_STAGES[0]!;
}
