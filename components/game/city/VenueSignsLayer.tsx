import { forwardRef, memo } from 'react';
import {
  CITY_GND_W,
  GND_F,
  gndOriginForTile,
  gndWidthForTile,
  nearGndTiles,
} from '@/lib/parallax';
import { TileRoadSigns } from '../VenueRoadSigns';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';

const GND_Y = 685;

type VenueSignsLayerProps = {
  worldOff: number;
};

// Module-level: pure function of tile index — always the same reference.
function renderSignTile(t: number) {
  return <TileRoadSigns tileIndex={t} y={GND_Y + 12} groundTile={gndWidthForTile(t)} />;
}

/** Sidewalk venue signs on ground parallax (no mid-layer drift). */
export const VenueSignsLayer = memo(forwardRef<SVGSVGElement, VenueSignsLayerProps>(
  function VenueSignsLayer({ worldOff }, ref) {
    const vxGnd = worldOff * GND_F;

    return (
      <ParallaxSvgLayer
        ref={ref}
        viewBoxX={vxGnd}
        tileWidth={CITY_GND_W}
        tileOrigin={gndOriginForTile}
        nearTileIndices={nearGndTiles}
        shapeRendering="optimizeSpeed"
        style={{ zIndex: 6, pointerEvents: 'none' }}
        children={renderSignTile}
      />
    );
  },
));
