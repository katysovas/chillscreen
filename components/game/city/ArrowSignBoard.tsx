/** Chevron sign body — flat back toward pole, tip points `dir`. Centered at (0, cy). */
export function arrowSignPath(
  dir: 'left' | 'right',
  cy: number,
  halfLen: number,
  halfH: number,
  tipLen: number,
) {
  if (dir === 'right') {
    const back = -halfLen;
    const shoulder = halfLen - tipLen;
    const tip = halfLen;
    return [
      `M${back},${cy - halfH}`,
      `L${shoulder},${cy - halfH}`,
      `L${tip},${cy}`,
      `L${shoulder},${cy + halfH}`,
      `L${back},${cy + halfH}`,
      'Z',
    ].join(' ');
  }
  const back = halfLen;
  const shoulder = -halfLen + tipLen;
  const tip = -halfLen;
  return [
    `M${back},${cy - halfH}`,
    `L${shoulder},${cy - halfH}`,
    `L${tip},${cy}`,
    `L${shoulder},${cy + halfH}`,
    `L${back},${cy + halfH}`,
    'Z',
  ].join(' ');
}

export type ArrowSignBoardProps = {
  cy: number;
  dir: 'left' | 'right';
  label: string;
  icon: string;
  accent: string;
  halfLen?: number;
  halfH?: number;
  tipLen?: number;
};

/** Arrow-shaped direction sign — same chevron as the welcome junction wings. */
export function ArrowSignBoard({
  cy,
  dir,
  label,
  icon,
  accent,
  halfLen = 66,
  halfH = 21,
  tipLen = 20,
}: ArrowSignBoardProps) {
  const d = arrowSignPath(dir, cy, halfLen, halfH, tipLen);
  const fontSize = label.length > 14 ? 8.5 : label.length > 10 ? 9.5 : 11;
  const labelX = dir === 'left' ? halfLen * 0.22 : -halfLen * 0.22;

  return (
    <g>
      <path d={d} fill="#faf6ee" stroke="#3a342c" strokeWidth={2.5} strokeLinejoin="round" />
      <path d={d} fill={accent} opacity={0.2} stroke="none" />
      {dir === 'right' ? (
        <>
          <circle cx={-halfLen + 7} cy={cy - halfH + 9} r={2} fill="#5c4636" stroke="#3a342c" strokeWidth={0.7} />
          <circle cx={-halfLen + 7} cy={cy + halfH - 9} r={2} fill="#5c4636" stroke="#3a342c" strokeWidth={0.7} />
        </>
      ) : (
        <>
          <circle cx={halfLen - 7} cy={cy - halfH + 9} r={2} fill="#5c4636" stroke="#3a342c" strokeWidth={0.7} />
          <circle cx={halfLen - 7} cy={cy + halfH - 9} r={2} fill="#5c4636" stroke="#3a342c" strokeWidth={0.7} />
        </>
      )}
      <text
        x={labelX}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight={800}
        fill="#2a2820"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {icon} {label}
      </text>
    </g>
  );
}

/** Wooden post + arm connecting to the flat back of an arrow wing. */
export function SignPost({
  postTop,
  postH,
  armCy,
  armDir,
  wingOffset,
  arrowHalfLen,
}: {
  postTop: number;
  postH: number;
  armCy: number;
  armDir: 'left' | 'right';
  wingOffset: number;
  arrowHalfLen: number;
}) {
  const postW = 8;
  return (
    <>
      <rect x={-postW / 2} y={postTop} width={postW} height={postH} rx={2} fill="#5c4636" />
      <rect
        x={-postW / 2 + 1}
        y={postTop}
        width={postW - 2}
        height={postH - 2}
        rx={1.5}
        fill="#8a6b4f"
      />
      <line
        x1={0}
        y1={postTop + 6}
        x2={0}
        y2={-4}
        stroke="#6b5344"
        strokeWidth={1}
        opacity={0.45}
      />
      <circle cx={0} cy={postTop + 2} r={3} fill="#6b5344" stroke="#3a342c" strokeWidth={0.8} />
      <line
        x1={armDir === 'left' ? -postW / 2 : postW / 2}
        y1={armCy}
        x2={armDir === 'left' ? -wingOffset + arrowHalfLen : wingOffset - arrowHalfLen}
        y2={armCy}
        stroke="#6b5344"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </>
  );
}
