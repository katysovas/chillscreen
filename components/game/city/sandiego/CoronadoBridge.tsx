// All geometry pre-computed at module load — zero runtime math on every render.
const X0   = 140;
const X1   = 1010;
const MID  = (X0 + X1) / 2;
const ENDY = 481;
const CTLY = 231;
const WATER= 602;

const B  = '#4a78aa';
const BD = '#36597f';
const BL = '#6f9bc8';

/** Quadratic Bézier y-coordinate of the deck arc at x. */
function deckYAt(x: number) {
  const t = (x - X0) / (X1 - X0);
  const u = 1 - t;
  return u * u * ENDY + 2 * u * t * CTLY + t * t * ENDY;
}

const DECK = `M${X0},${ENDY} Q${MID},${CTLY} ${X1},${ENDY}`;

const PIER_XS = [220, 320, 420, 510, MID, 640, 730, 830, 930];

type PierGeom = {
  main:   string;   // polygon points for main trapezoid
  shadow: string;   // polygon points for shadow edge
  capX:   number;   // rect x
  capY:   number;   // rect y
};

const PIERS: PierGeom[] = PIER_XS.map(px => {
  const dy   = deckYAt(px) + 6;
  const lean = (px - MID) * 0.02;
  const topW = 7;
  const botW = 4;
  return {
    main:  `${px - topW / 2},${dy} ${px + topW / 2},${dy} ${px + lean + botW / 2},${WATER} ${px + lean - botW / 2},${WATER}`,
    shadow:`${px - topW / 2},${dy} ${px - topW / 2 + 2},${dy} ${px + lean - botW / 2 + 2},${WATER} ${px + lean - botW / 2},${WATER}`,
    capX:  px - 9,
    capY:  dy - 5,
  };
});

/** San Diego–Coronado Bridge — sweeping curved deck on slender blue piers. */
export function CoronadoBridge() {
  return (
    <g>
      {PIERS.map((p, i) => (
        <g key={i}>
          <polygon points={p.main}   fill={B} />
          <polygon points={p.shadow} fill={BD} />
          <rect x={p.capX} y={p.capY} width={18} height={6} rx={2} fill={B} />
        </g>
      ))}
      <path d={DECK} fill="none" stroke={BD} strokeWidth={13} />
      <path d={DECK} fill="none" stroke={B}  strokeWidth={9} />
      <path d={DECK} fill="none" stroke={BL} strokeWidth={2.5} />
      <line x1={X0} y1={ENDY} x2={X0 - 60} y2={ENDY + 34} stroke={B} strokeWidth={9} strokeLinecap="round" />
      <line x1={X1} y1={ENDY} x2={X1 + 70} y2={ENDY + 40} stroke={B} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
}
