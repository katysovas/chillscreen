/** Seattle Great Wheel — waterfront Ferris wheel. */
export function GreatWheel() {
  const cx = 330;
  const cy = 540;
  const r = 84;

  const gondolas = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return { gx: cx + Math.cos(a) * r, gy: cy + Math.sin(a) * r };
  });

  const spokes = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return { x2: cx + Math.cos(a) * r, y2: cy + Math.sin(a) * r };
  });

  return (
    <g>
      <line x1={cx} y1={cy} x2={cx - 60} y2={636} stroke="#c4ccd6" strokeWidth={6} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + 60} y2={636} stroke="#c4ccd6" strokeWidth={6} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx - 26} y2={636} stroke="#aeb6c2" strokeWidth={4} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + 26} y2={636} stroke="#aeb6c2" strokeWidth={4} strokeLinecap="round" />
      <rect x={cx - 78} y={634} width={156} height={8} rx={2} fill="#6f5a44" />
      {spokes.map((s, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={s.x2}
          y2={s.y2}
          stroke="rgba(220,228,236,.55)"
          strokeWidth={1.2}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#dfe5ec" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke="rgba(223,229,236,.5)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={10} fill="#cdd5df" stroke="#aeb6c2" strokeWidth={2} />
      {gondolas.map((g, i) => (
        <g key={i}>
          <rect x={g.gx - 4} y={g.gy - 3} width={8} height={9} rx={2} fill="#e3e8ee" />
          <circle
            cx={g.gx}
            cy={g.gy + 8}
            r={1.6}
            fill={['#4aa3e0', '#e0708a', '#5ad0b0', '#e8c060'][i % 4]}
            opacity={0.8}
          />
        </g>
      ))}
    </g>
  );
}
