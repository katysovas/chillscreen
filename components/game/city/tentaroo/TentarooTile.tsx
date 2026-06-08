import {
  TENTAROO_ARCH_ART_GROUND_Y,
  TENTAROO_ARCH_ART_H,
  TENTAROO_ARCH_ART_MID_X,
  TENTAROO_ARCH_ART_W,
  TENTAROO_ARCH_MID_X,
  TENTAROO_ARCH_SCALE,
  TENTAROO_GND,
} from './constants';

/** Tent city — tents, totems + separate Bonnaroo-style arch overlay. */
export function TentarooTile() {
  const s = TENTAROO_ARCH_SCALE;
  const archW = TENTAROO_ARCH_ART_W * s;
  const archH = TENTAROO_ARCH_ART_H * s;
  const archX = TENTAROO_ARCH_MID_X - TENTAROO_ARCH_ART_MID_X * s;
  const archY = TENTAROO_GND - TENTAROO_ARCH_ART_GROUND_Y * s;

  return (
    <>
      <image
        href="/images/cities/tentaroo-scene.svg?v=2"
        x={0}
        y={0}
        width={2600}
        height={800}
        preserveAspectRatio="xMidYMax meet"
      />
      <image
        href="/images/cities/tentaroo-arch.svg"
        x={archX}
        y={archY}
        width={archW}
        height={archH}
        preserveAspectRatio="xMidYMax meet"
      />
    </>
  );
}
