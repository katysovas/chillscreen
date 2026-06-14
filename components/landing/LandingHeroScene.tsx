export function LandingHeroStageLayer() {
  return (
    <div className="hero-stage-layer" aria-hidden>
      <div className="hero-stage-neon hero-stage-neon--magenta" />
      <div className="hero-stage-neon hero-stage-neon--cyan" />
      <div className="hero-stage-neon hero-stage-neon--laser" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="hero-stage-scene"
        src="/images/cities/silent-disco-scene.svg"
        alt=""
        decoding="async"
      />
      <div className="hero-stage-floor" />
    </div>
  );
}
