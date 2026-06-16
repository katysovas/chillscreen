import { CREATOR_SCENE_HREF } from './constants';

/** Chill template — farm tents & totems without arch or canopy overlay. */
export function ChillTile() {
  return (
    <image
      href={CREATOR_SCENE_HREF}
      x={0}
      y={0}
      width={2600}
      height={800}
      preserveAspectRatio="xMidYMax meet"
    />
  );
}
