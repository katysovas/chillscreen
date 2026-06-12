import { DEEP_SPACE_MID_X } from '@/lib/venues';
import {
  ORBIT_SCENE_LEFT_FLOATERS,
  ORBIT_SCENE_RIGHT_FLOATERS,
  ORBIT_SCENE_SKY,
  ORBIT_SCENE_STYLES,
  ORBIT_SCENE_SURFACE,
} from './orbitSceneMarkup';

/** Flank offset from stage center — planet left, astronaut right. */
const LEFT_FLANK_X = DEEP_SPACE_MID_X - 620;
const RIGHT_FLANK_X = DEEP_SPACE_MID_X + 620;

/** Original art anchors in the preview SVG. */
const PLANET_ORIGIN_X = 400;
const ASTRONAUT_ORIGIN_X = 2120;

/** Deep Space — cosmic orbit backdrop (2600×720 art, mid-layer tile). */
export function OrbitMidTile() {
  const leftShift = LEFT_FLANK_X - PLANET_ORIGIN_X;
  const rightShift = RIGHT_FLANK_X - ASTRONAUT_ORIGIN_X;

  return (
    <g aria-hidden>
      <rect x={0} y={0} width={2600} height={900} fill="#120a24" />
      <g dangerouslySetInnerHTML={{ __html: ORBIT_SCENE_STYLES }} />
      <g dangerouslySetInnerHTML={{ __html: ORBIT_SCENE_SKY }} />
      <g transform={`translate(${leftShift}, 0)`}>
        <g dangerouslySetInnerHTML={{ __html: ORBIT_SCENE_LEFT_FLOATERS }} />
      </g>
      <g transform={`translate(${rightShift}, 0)`}>
        <g dangerouslySetInnerHTML={{ __html: ORBIT_SCENE_RIGHT_FLOATERS }} />
      </g>
      <g dangerouslySetInnerHTML={{ __html: ORBIT_SCENE_SURFACE }} />
      <rect x={0} y={720} width={2600} height={180} fill="#1a1430" />
    </g>
  );
}
