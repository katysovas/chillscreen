/** SF-only landmarks (terrain base comes from GradientMidTerrain). */
export function SfMidFeatures() {
  return (
    <g>
      <GoldenGateBridge />
    </g>
  );
}

// Inline bridge — keep in this file to avoid circular imports
function sampleQuad(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  n: number,
) {
  const out: { x: number; y: number }[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push({
      x: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    });
  }
  return out;
}

function GoldenGateBridge() {
  const O = '#c24f2c';
  const OD = '#9b3d1f';
  const OL = '#dd724a';
  const T1 = 138;
  const T2 = 318;
  const MID = 228;
  const topY = 336;
  const deckY = 574;
  const baseY = 622;
  const aL = 8;
  const aR = 446;
  const gap = 9;
  const dip = 728;

  const cable =
    `M ${aL},${deckY - 2} Q 80,414 ${T1},${topY} ` +
    `Q ${MID},${dip} ${T2},${topY} ` +
    `Q 378,414 ${aR},${deckY - 2}`;

  const suspenders = [
    ...sampleQuad([aL, deckY - 2], [80, 414], [T1, topY], 5),
    ...sampleQuad([T1, topY], [MID, dip], [T2, topY], 13),
    ...sampleQuad([T2, topY], [378, 414], [aR, deckY - 2], 5),
  ];

  const legPts = (cx: number) => {
    const bw = 6.5;
    const tw = 4.5;
    return `${cx - bw / 2},${baseY} ${cx + bw / 2},${baseY} ${cx + tw / 2},${topY} ${cx - tw / 2},${topY}`;
  };

  return (
    <g>
      <path d={cable} fill="none" stroke={OD} strokeWidth={3.5} />
      <path d={cable} fill="none" stroke={O} strokeWidth={1.8} />
      {suspenders.map((s, i) => (
        <line
          key={i}
          x1={s.x}
          y1={s.y}
          x2={s.x}
          y2={deckY}
          stroke={OD}
          strokeWidth={0.8}
          opacity={0.6}
        />
      ))}
      <rect x={aL} y={deckY} width={aR - aL} height={6} fill={OD} />
      <rect x={aL} y={deckY} width={aR - aL} height={2.5} fill={O} />
      {[T1, T2].map((cx, ti) => (
        <g key={ti}>
          <polygon points={legPts(cx - gap)} fill={O} />
          <polygon points={legPts(cx + gap)} fill={O} />
          <polygon points={legPts(cx - gap)} fill={OD} opacity={0.35} />
          <polygon points={legPts(cx + gap)} fill={OL} opacity={0.22} />
          {[366, 426, 486, 544].map((by, bi) => (
            <rect key={bi} x={cx - gap - 1} y={by} width={gap * 2 + 2} height={4.5} fill={O} />
          ))}
          <path
            d={`M ${cx - gap - 1},${deckY} L ${cx - gap - 1},${deckY - 15}
                Q ${cx},${deckY - 23} ${cx + gap + 1},${deckY - 15} L ${cx + gap + 1},${deckY}`}
            fill="none"
            stroke={O}
            strokeWidth={2.5}
          />
          <rect x={cx - gap - 1.5} y={topY - 4} width={gap * 2 + 3} height={5} fill={O} />
          <rect x={cx - gap + 1} y={topY - 9} width={gap * 2 - 2} height={5} fill={O} />
          <rect x={cx - gap + 3} y={topY - 13} width={gap * 2 - 6} height={5} fill={O} />
        </g>
      ))}
    </g>
  );
}
