import { SEATTLE_GND } from '../constants';

/** Columbia Center — tallest downtown slab. */
export function ColumbiaCenter() {
  const GND = SEATTLE_GND;

  return (
    <g>
      <rect x={1296} y={GND - 300} width={26} height={300} fill="#333b48" />
      <rect x={1320} y={GND - 360} width={54} height={360} fill="#3a4350" />
      <rect x={1320} y={GND - 360} width={9} height={360} fill="rgba(0,0,0,.28)" />
      <rect x={1369} y={GND - 360} width={5} height={360} fill="rgba(255,255,255,.06)" />
      <rect x={1372} y={GND - 326} width={24} height={326} fill="#353d4a" />
      {Array.from({ length: 17 }, (_, r) => (
        <line
          key={r}
          x1={1320}
          y1={GND - 350 + r * 20}
          x2={1374}
          y2={GND - 350 + r * 20}
          stroke="rgba(120,150,185,.18)"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: 4 }, (_, c) => (
        <line
          key={c}
          x1={1330 + c * 11}
          y1={GND - 360}
          x2={1330 + c * 11}
          y2={GND}
          stroke="rgba(120,150,185,.16)"
          strokeWidth={1}
        />
      ))}
      <rect x={1320} y={GND - 364} width={54} height={5} fill="#2a313c" />
      <circle cx={1347} cy={GND - 368} r={2.4} fill="#e8503c" />
      <circle cx={1347} cy={GND - 368} r={4.5} fill="rgba(232,80,60,.3)" />
    </g>
  );
}
