import {
  TENTAROO_ARCH_ART_GROUND_Y,
  TENTAROO_ARCH_ART_MID_X,
  TENTAROO_ARCH_MID_X,
  TENTAROO_ARCH_SCALE,
  TENTAROO_GND,
} from './constants';

type TentarooArchLabelProps = {
  tile: number;
};

/** "the farm" arch lettering — foreground so it paints over the sky moon. */
export function TentarooArchLabel({ tile }: TentarooArchLabelProps) {
  const s = TENTAROO_ARCH_SCALE;
  const archX = TENTAROO_ARCH_MID_X - TENTAROO_ARCH_ART_MID_X * s;
  const archY = TENTAROO_GND - TENTAROO_ARCH_ART_GROUND_Y * s;
  const pathId = `farm-wordpath-${tile}`;

  return (
    <g transform={`translate(${archX}, ${archY}) scale(${s})`}>
      <path id={pathId} d="M170 629 A542 542 0 0 1 1230 629" fill="none" />
      <text
        fontFamily="Fredoka, Arial Black, sans-serif"
        fontWeight={700}
        fontSize={108}
        fill="#34c24a"
        stroke="#1f8a2f"
        strokeWidth={3}
        letterSpacing={2}
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          the farm
        </textPath>
      </text>
    </g>
  );
}
