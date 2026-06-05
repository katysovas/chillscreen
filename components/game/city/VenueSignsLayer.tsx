import { GND_F, GND_TILE } from '@/lib/parallax';
import { TileRoadSigns } from '../VenueRoadSigns';
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
      {t => <TileRoadSigns tileIndex={t} y={GND_Y + 12} groundTile={GND_TILE} />}
    </ParallaxSvgLayer>
  );
}
