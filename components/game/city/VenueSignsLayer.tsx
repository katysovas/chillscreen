import { GND_F, GND_TILE } from '@/lib/parallax';
import { VenueRoadSigns } from '../VenueRoadSigns';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';

const GND_Y = 685;

type VenueSignsLayerProps = {
  worldOff: number;
};

/** Sidewalk venue signs on ground parallax (no mid-layer drift). */
export function VenueSignsLayer({ worldOff }: VenueSignsLayerProps) {
  const vxGnd = worldOff * GND_F;

  return (
    <ParallaxSvgLayer
      viewBoxX={vxGnd}
      tileWidth={GND_TILE}
      style={{ zIndex: 6, pointerEvents: 'none' }}
    >
      {() => <VenueRoadSigns y={GND_Y + 12} groundTile={GND_TILE} />}
    </ParallaxSvgLayer>
  );
}
