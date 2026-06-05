import { MID_W } from '../shared/terrainPaths';
import { DESERT_FAR, DESERT_MID, DESERT_NEAR } from './constants';

/**
 * Desert mountains — warm layered ridges (Coachella Valley).
 *
 * A vertical alpha mask fades the ridges from fully transparent above y=380
 * to fully opaque by y=490.  This means the parts of the ridges that would
 * sit in the open sky are invisible, so the SkyLayer gradient shows through
 * unobstructed and no tile-boundary seam appears in the sky.
 * Below y=490 (terrain / horizon band) the ridges render at full opacity.
 *
 * Horizontal fades (fadeLeft / fadeRight) are applied on top to soften tile
 * edges when the desert tile is adjacent to a town tile.
 */
type DesertMountainsProps = {
  tileIndex?: number;
  fadeLeft?: boolean;
  fadeRight?: boolean;
};

export function DesertMountains({ tileIndex = 0, fadeLeft = false, fadeRight = false }: DesertMountainsProps) {
  const uid = `dm${tileIndex}`;

  const ridges = (
    <>
      <path
        d="M-2,470 L380,360 L640,430 L920,330 L1240,420 L1560,340 L1900,430 L2280,360 L2602,440 L2602,900 L-2,900 Z"
        fill={DESERT_FAR}
        shapeRendering="optimizeSpeed"
      />
      <path
        d="M-2,520 L300,440 L560,500 L880,410 L1200,500 L1520,430 L1880,510 L2240,440 L2602,510 L2602,900 L-2,900 Z"
        fill={DESERT_MID}
        opacity={0.92}
        shapeRendering="optimizeSpeed"
      />
      <path
        d="M-2,576 L260,520 L520,566 L820,500 L1140,572 L1480,512 L1840,574 L2200,520 L2602,572 L2602,900 L-2,900 Z"
        fill={DESERT_NEAR}
        shapeRendering="optimizeSpeed"
      />
    </>
  );

  // Vertical mask: ridges fade from transparent (sky area) to opaque (terrain area).
  // Stop positions chosen so the open sky (y < 380) is always transparent.
  const vMaskId  = `${uid}-vm`;
  const vGradId  = `${uid}-vg`;

  // Horizontal mask when adjacent to a town tile on either side.
  const hMaskId  = `${uid}-hm`;
  const hGradId  = `${uid}-hg`;
  const needsH   = fadeLeft || fadeRight;

  const content = (
    <g>
      <defs>
        {/* Vertical alpha gradient — transparent at sky, opaque at terrain */}
        <linearGradient id={vGradId} gradientUnits="userSpaceOnUse" x1={0} y1={380} x2={0} y2={490}>
          <stop offset="0%"   stopColor="white" stopOpacity={0} />
          <stop offset="100%" stopColor="white" stopOpacity={1} />
        </linearGradient>
        <mask id={vMaskId}>
          <rect x={-2} y={0} width={MID_W + 4} height={900} fill={`url(#${vGradId})`} />
        </mask>

        {/* Horizontal alpha gradient for tile-edge softening */}
        {needsH && (
          <>
            <linearGradient id={hGradId} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={MID_W} y2={0}>
              <stop offset="0%"   stopColor="white" stopOpacity={fadeLeft  ? 0 : 1} />
              <stop offset="14%"  stopColor="white" stopOpacity={1} />
              <stop offset="86%"  stopColor="white" stopOpacity={1} />
              <stop offset="100%" stopColor="white" stopOpacity={fadeRight ? 0 : 1} />
            </linearGradient>
            <mask id={hMaskId}>
              <rect width={MID_W} height={900} fill={`url(#${hGradId})`} />
            </mask>
          </>
        )}
      </defs>

      {/* Vertical mask applied first — sky area is transparent */}
      <g mask={`url(#${vMaskId})`}>
        {needsH ? (
          <g mask={`url(#${hMaskId})`}>{ridges}</g>
        ) : (
          ridges
        )}
      </g>
    </g>
  );

  return content;
}
