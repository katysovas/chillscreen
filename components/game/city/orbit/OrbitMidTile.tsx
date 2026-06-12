import { DEEP_SPACE_MID_X } from '@/lib/venues';
import { ORBIT_SCENE_PLANETS } from './orbitSceneLite';

/** Flank offset from stage center — planet left of the stage. */
const LEFT_FLANK_X = DEEP_SPACE_MID_X - 620;

/** Original art anchor in the preview SVG. */
const PLANET_ORIGIN_X = 400;

/** Deep Space — parallax stars (SpaceParallaxStars) + static planets only. */
export function OrbitMidTile() {
  const leftShift = LEFT_FLANK_X - PLANET_ORIGIN_X;

  return (
    <g aria-hidden>
      <g transform={`translate(${leftShift}, 0)`}>
        <g dangerouslySetInnerHTML={{ __html: ORBIT_SCENE_PLANETS }} />
      </g>
    </g>
  );
}
