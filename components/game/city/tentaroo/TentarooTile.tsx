import {
  TENTAROO_ARCH_ART_GROUND_Y,
  TENTAROO_ARCH_ART_H,
  TENTAROO_ARCH_ART_MID_X,
  TENTAROO_ARCH_ART_W,
  TENTAROO_ARCH_MID_X,
  TENTAROO_ARCH_SCALE,
  TENTAROO_GND,
  TENTAROO_MID_TILE_H,
  TENTAROO_MID_TILE_W,
  TENTAROO_STATIC_VIEWPORT_W,
  TENTAROO_STATIC_VIEWPORT_X,
} from './constants';

const SCENE_HREF = '/images/cities/tentaroo-scene.svg?v=2';
const ARCH_HREF = '/images/cities/tentaroo-arch.svg?v=3';
const STATIC_CLIP_ID = 'tentaroo-static-viewport-clip';

type TentarooTileProps = {
  /** Fixed-camera mode — backdrop covers the viewport slice only. */
  fitViewport?: boolean;
};

function TentarooArch() {
  const s = TENTAROO_ARCH_SCALE;
  const archW = TENTAROO_ARCH_ART_W * s;
  const archH = TENTAROO_ARCH_ART_H * s;
  const archX = TENTAROO_ARCH_MID_X - TENTAROO_ARCH_ART_MID_X * s;
  const archY = TENTAROO_GND - TENTAROO_ARCH_ART_GROUND_Y * s;

  return (
    <image
      href={ARCH_HREF}
      x={archX}
      y={archY}
      width={archW}
      height={archH}
      preserveAspectRatio="xMidYMax meet"
    />
  );
}

/** Tent city — tents, totems + separate Bonnaroo-style arch overlay. */
export function TentarooTile({ fitViewport = false }: TentarooTileProps) {
  if (!fitViewport) {
    return (
      <>
        <image
          href={SCENE_HREF}
          x={0}
          y={0}
          width={TENTAROO_MID_TILE_W}
          height={800}
          preserveAspectRatio="xMidYMax meet"
        />
        <TentarooArch />
      </>
    );
  }

  const vx = TENTAROO_STATIC_VIEWPORT_X;
  const vw = TENTAROO_STATIC_VIEWPORT_W;
  const vh = TENTAROO_MID_TILE_H;

  return (
    <>
      <defs>
        <clipPath id={STATIC_CLIP_ID}>
          <rect x={vx} y={0} width={vw} height={vh} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${STATIC_CLIP_ID})`}>
        <image
          href={SCENE_HREF}
          x={0}
          y={0}
          width={TENTAROO_MID_TILE_W}
          height={800}
          preserveAspectRatio="xMidYMax slice"
        />
        <TentarooArch />
      </g>
    </>
  );
}
