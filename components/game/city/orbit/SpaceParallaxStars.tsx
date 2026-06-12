'use client';

import { memo, useEffect, useState } from 'react';
import {
  SPACE_PARALLAX_LOOP_PX,
  SPACE_PARALLAX_SHADOWS,
  SPACE_PARALLAX_SHADOWS_MOBILE,
} from '@/lib/spaceParallaxStars';

type StarTierProps = {
  shadow: string;
  size: number;
  durationSec: number;
};

const StarTier = memo(function StarTier({ shadow, size, durationSec }: StarTierProps) {
  if (!shadow) return null;

  const dotStyle = {
    width: size,
    height: size,
    boxShadow: shadow,
  } as const;

  return (
    <div
      className="space-parallax-stars__tier"
      style={{ animationDuration: `${durationSec}s` }}
    >
      <div className="space-parallax-stars__dot" style={dotStyle} />
      <div
        className="space-parallax-stars__dot space-parallax-stars__dot--repeat"
        style={{ ...dotStyle, top: SPACE_PARALLAX_LOOP_PX }}
      />
    </div>
  );
});

/** CSS parallax pixel stars — deep space sky (no text). */
export const SpaceParallaxStars = memo(function SpaceParallaxStars() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const shadows = mobile ? SPACE_PARALLAX_SHADOWS_MOBILE : SPACE_PARALLAX_SHADOWS;

  return (
    <div className="space-parallax-stars" aria-hidden>
      <StarTier shadow={shadows.sm} size={1} durationSec={50} />
      <StarTier shadow={shadows.md} size={2} durationSec={100} />
      <StarTier shadow={shadows.lg} size={3} durationSec={150} />
    </div>
  );
});
