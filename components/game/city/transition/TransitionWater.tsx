import { worldTileKind } from '@/lib/worldTiles';
import { DECORATIVE_SHAPE } from '../shared/parallaxLayerStyle';
import { MID_W } from '../shared/terrainPaths';
import { WATER_PATH, SF_WATER, SEA_WATER } from '../shared/terrainPaths';

type TransitionWaterProps = {
  tileIndex: number;
  /** Isolated static viewport — solid bay fill without tile-edge fades. */
  staticViewport?: boolean;
};

/** City waterfront only — countryside tiles have no bay / sound. */
export function TransitionWater({ tileIndex, staticViewport = false }: TransitionWaterProps) {
  const kind = worldTileKind(tileIndex);
  const left = worldTileKind(tileIndex - 1);
  const right = worldTileKind(tileIndex + 1);
  const uid = `tw${tileIndex}`;

  if (kind === 'town' || kind === 'san_diego' || kind === 'coachella' || kind === 'tentaroo' || kind === 'forest' || kind === 'silent_disco' || kind === 'vegas') return null;

  if (kind === 'sf') {
    if (staticViewport) {
      return (
        <g {...DECORATIVE_SHAPE}>
          <path d={WATER_PATH} fill={SF_WATER} />
          <line x1={28} y1={604} x2={250} y2={604} stroke="#c6d4e0" strokeWidth={2} opacity={0.4} />
          <line x1={70} y1={620} x2={300} y2={620} stroke="#b2c8d6" strokeWidth={2} opacity={0.32} />
        </g>
      );
    }

    const fadeRight = right !== 'sf';
    return (
      <g {...DECORATIVE_SHAPE}>
        <defs>
          <linearGradient id={`sfw-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={MID_W} y2={0}>
            <stop offset="0%" stopColor={SF_WATER} stopOpacity={left === 'town' ? 0.85 : 1} />
            <stop offset={fadeRight ? '72%' : '100%'} stopColor={SF_WATER} stopOpacity={1} />
            {fadeRight && <stop offset="100%" stopColor={SF_WATER} stopOpacity={0} />}
          </linearGradient>
        </defs>
        <path d={WATER_PATH} fill={`url(#sfw-${uid})`} />
        <line x1={28} y1={604} x2={250} y2={604} stroke="#c6d4e0" strokeWidth={2} opacity={0.4} />
        <line x1={70} y1={620} x2={300} y2={620} stroke="#b2c8d6" strokeWidth={2} opacity={0.32} />
      </g>
    );
  }

  const fadeLeft = left !== 'seattle';
  const fadeRight = right !== 'seattle';

  if (kind !== 'seattle') return null;

  return (
    <g {...DECORATIVE_SHAPE}>
      <defs>
        <linearGradient id={`seaw-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={MID_W} y2={0}>
          {fadeLeft && <stop offset="0%" stopColor={SEA_WATER} stopOpacity={0} />}
          <stop offset={fadeLeft ? '28%' : '0%'} stopColor={SEA_WATER} stopOpacity={1} />
          <stop offset={fadeRight ? '78%' : '100%'} stopColor={SEA_WATER} stopOpacity={1} />
          {fadeRight && <stop offset="100%" stopColor={SEA_WATER} stopOpacity={0} />}
        </linearGradient>
      </defs>
      <path d={WATER_PATH} fill={`url(#seaw-${uid})`} />
    </g>
  );
}
