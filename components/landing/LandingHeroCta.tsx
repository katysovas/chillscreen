'use client';

import { LANDING_HERO } from './landingHeroCopy';
import { useLandingFestieTotal } from './useLandingFestieTotal';
import { useLandingStageCount } from './useLandingStageCount';

type Props = {
  onScrollToStages: () => void;
};

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingHeroCta({ onScrollToStages }: Props) {
  const festieTotal = useLandingFestieTotal();
  const festieDisplay = festieTotal.toLocaleString();
  const stageCount = useLandingStageCount();

  return (
    <button type="button" className="hero-cta-bar" onClick={onScrollToStages}>
      <span className="hero-cta-bar__action">
        {LANDING_HERO.cta}
        <ArrowIcon />
      </span>
      <span className="hero-cta-bar__divider" aria-hidden />
      <span className="hero-cta-bar__stat">
        <span className="hero-cta-bar__stat-count">{stageCount}</span>
        <span className="hero-cta-bar__stat-label">Stages</span>
      </span>
      <span className="hero-cta-bar__divider" aria-hidden />
      <span className="hero-cta-bar__stat hero-cta-bar__festies" aria-live="polite">
        <span className="hero-cta-bar__dot" aria-hidden />
        <span className="hero-cta-bar__festies-count">{festieDisplay}</span>
        <span className="hero-cta-bar__stat-label">Festies</span>
      </span>
    </button>
  );
}
