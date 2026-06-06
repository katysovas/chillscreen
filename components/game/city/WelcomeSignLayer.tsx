import { forwardRef, memo } from 'react';
import { WelcomeStageSign } from '../WelcomeStageSign';
import { GND_F } from '@/lib/parallax';

const GND_Y = 685;

type WelcomeSignLayerProps = {
  worldOff: number;
  spawnWorldOff: number;
};

/** Fixed spawn-area welcome kiosk on ground parallax (not tiled). */
export const WelcomeSignLayer = memo(forwardRef<SVGSVGElement, WelcomeSignLayerProps>(
  function WelcomeSignLayer({ worldOff, spawnWorldOff }, ref) {
    const vxGnd = worldOff * GND_F;

    return (
      <svg
        ref={ref}
        viewBox={`${vxGnd} 0 1400 900`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 7,
          pointerEvents: 'none',
          willChange: 'transform',
          contain: 'layout style paint',
        }}
      >
        <WelcomeStageSign spawnWorldOff={spawnWorldOff} y={GND_Y + 12} />
      </svg>
    );
  },
));
