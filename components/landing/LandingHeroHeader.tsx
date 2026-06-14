'use client';

import { LANDING_HERO } from './landingHeroCopy';
import { useLandingFestieTotal } from './useLandingFestieTotal';

export function LandingHeroHeader() {
  const festieTotal = useLandingFestieTotal();
  const festieDisplay = festieTotal.toLocaleString();

  return (
    <div className="hero-header">
      <p className="hero-eyebrow" aria-live="polite">
        <strong>Live</strong>
        {' now · '}
        <strong>{festieDisplay}</strong>
        {` ${LANDING_HERO.eyebrowFestiesLabel} · `}
        <strong>Free</strong> For Humans
      </p>
      <h1 className="hero-title">
        {LANDING_HERO.title.split('\n').map((line, i) => (
          <span key={i} className="hero-title-line">
            {line}
          </span>
        ))}
      </h1>
      <p className="hero-subtitle">{LANDING_HERO.subtitle}</p>
    </div>
  );
}
