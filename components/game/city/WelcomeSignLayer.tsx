import { forwardRef, memo } from 'react';
import { WelcomeStageSign } from '../WelcomeStageSign';
import { GND_F } from '@/lib/parallax';
import { PARALLAX_LAYER_BASE } from './shared/parallaxLayerStyle';

const GND_Y = 685;

type WelcomeSignLayerProps = {
  spawnWorldOff: number;
};

/** Fixed spawn-area welcome kiosk on ground parallax (not tiled). */
export const WelcomeSignLayer = memo(forwardRef<SVGSVGElement, WelcomeSignLayerProps>(
  function WelcomeSignLayer({ spawnWorldOff }, ref) {
    const initialVxGnd = spawnWorldOff * GND_F;

    return (
      <svg
        ref={ref}
        viewBox={`${initialVxGnd} 0 1400 900`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="optimizeSpeed"
        style={{
          ...PARALLAX_LAYER_BASE,
          zIndex: 7,
          pointerEvents: 'none',
        }}
      >
        <WelcomeStageSign spawnWorldOff={spawnWorldOff} y={GND_Y + 12} />
      </svg>
    );
  },
));
