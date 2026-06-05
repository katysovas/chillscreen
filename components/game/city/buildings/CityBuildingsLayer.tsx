import { MID_F, MID_TILE } from '@/lib/parallax';
import { ParallaxSvgLayer } from '../shared/ParallaxSvgLayer';
import { CityBuildingsTile } from './CityBuildingsTile';

type CityBuildingsLayerProps = {
  worldOff: number;
};

/**
 * Standalone mid-parallax building skyline (Victorian row, towers, hillside).
 * Compose {@link CityBuildingsTile} inside {@link MidLayer} when you need terrain and venues too.
 */
export function CityBuildingsLayer({ worldOff }: CityBuildingsLayerProps) {
  const vx = worldOff * MID_F;

  return (
    <ParallaxSvgLayer viewBoxX={vx} tileWidth={MID_TILE}>
      {() => <CityBuildingsTile />}
    </ParallaxSvgLayer>
  );
}
