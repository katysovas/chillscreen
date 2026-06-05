/** Hillside house cluster on the far right of the skyline. */
export function HillsideHouse() {
  return (
    <g opacity={0.72}>
      <path d="M1880,670 Q1960,610 2040,650 L2040,900 L1880,900 Z" fill="#8a9880" />
      <rect x={1920} y={548} width={80} height={122} fill="#d0c8b8" />
      <rect x={1920} y={548} width={12} height={122} fill="rgba(0,20,60,.2)" />
      <rect x={1934} y={388} width={52} height={162} fill="#d8d0c0" rx={26} />
      <rect x={1934} y={388} width={12} height={162} fill="rgba(0,20,60,.18)" rx={6} />
      <ellipse cx={1960} cy={388} rx={26} ry={8} fill="#c8c0b0" />
      <rect x={1952} y={358} width={16} height={32} fill="#c0b8a8" />
    </g>
  );
}
