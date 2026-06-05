import { SEATTLE_GND } from '../constants';

/** Smith Tower — white historic pyramid cap. */
export function SmithTower() {
  const GND = SEATTLE_GND;
  const x = 1108;
  const h = 240;

  return (
    <g>
      <rect x={x} y={GND - h} width={42} height={h} fill="#d8d4c8" />
      <rect x={x} y={GND - h} width={8}  height={h} fill="rgba(60,55,40,.18)" />
      {/* Window tint — single overlay replaces individual window rects */}
      <rect x={x + 6} y={GND - h + 8} width={30} height={h - 16} fill="rgba(90,110,130,.18)" />
      <rect x={1104} y={GND - 244} width={50} height={6} fill="#e6e2d6" />
      <polygon points={`1109,${GND - 244} 1149,${GND - 244} 1129,${GND - 286}`} fill="#cfcabb" />
      <polygon points={`1109,${GND - 244} 1129,${GND - 286} 1129,${GND - 244}`} fill="rgba(60,55,40,.16)" />
      <polygon points={`1124,${GND - 286} 1134,${GND - 286} 1129,${GND - 308}`} fill="#c2cdd6" />
      <rect x={1128} y={GND - 320} width={2} height={12} fill="#9aa0ae" />
    </g>
  );
}
