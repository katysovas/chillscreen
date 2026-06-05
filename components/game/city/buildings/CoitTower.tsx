/**
 * Transamerica Pyramid — San Francisco's most recognizable tower.
 *
 * NOTE: the previous `CoitTower` export actually drew this pyramid silhouette.
 * Coit Tower is the separate cylindrical landmark on Telegraph Hill (drawn
 * elsewhere in the scene). This is renamed for clarity, with a `CoitTower`
 * alias kept at the bottom so existing imports keep working.
 */
export function TransamericaPyramid() {
  const cx        = 1370;
  const baseY     = 660;
  const bodyTopY  = 302;   // where the pyramid body meets the spire
  const halfBase  = 56;    // half-width at the base
  const halfTop   = 7;     // half-width at the body top
  const spireTipY = 250;

  const FACE    = '#d0d4de'; // sunlit (right) face
  const SHADE   = '#aeb4c4'; // shaded (left) face
  const WING    = '#c6cad6'; // wing shafts
  const WING_HL = '#dde0e8';
  const SPIRE   = '#c8ccd6';
  const WIN     = 'rgba(110,150,195,.30)';
  const MAST    = '#9aa0ad';

  // y where a vertical line at horizontal distance d from centre exits the body
  const topYAt = (d: number) =>
    bodyTopY + (d - halfTop) / (halfBase - halfTop) * (baseY - bodyTopY);

  const winOffsets = [14, 24, 34, 44]; // vertical mullion distances from centre

  return (
    <g>
      {/* ── Two faces (centre ridge gives 3-D form) ── */}
      <polygon points={`${cx},${baseY} ${cx-halfBase},${baseY} ${cx-halfTop},${bodyTopY} ${cx},${bodyTopY}`} fill={SHADE} />
      <polygon points={`${cx},${baseY} ${cx+halfBase},${baseY} ${cx+halfTop},${bodyTopY} ${cx},${bodyTopY}`} fill={FACE} />
      <line x1={cx} y1={baseY} x2={cx} y2={bodyTopY} stroke="rgba(255,255,255,.25)" strokeWidth={1} />

      {/* ── Vertical window mullions ── */}
      {winOffsets.map((d, i) => (
        <g key={i}>
          <line x1={cx - d} y1={baseY} x2={cx - d} y2={topYAt(d)} stroke={WIN} strokeWidth={1.4} />
          <line x1={cx + d} y1={baseY} x2={cx + d} y2={topYAt(d)} stroke={WIN} strokeWidth={1.4} />
        </g>
      ))}

      {/* ── Base setback band ── */}
      <rect x={cx - halfBase - 2} y={baseY - 20} width={(halfBase + 2) * 2} height={5} fill={SHADE} opacity={0.45} />

      {/* ── Wings (east shorter, west taller — the iconic shoulders) ── */}
      {/* East wing (left) */}
      <polygon points="1341,460 1349,460 1349,346 1345,340 1341,346" fill={WING} />
      <rect x={1341} y={346} width={2} height={114} fill={WING_HL} opacity={0.6} />
      {/* West wing (right, taller) */}
      <polygon points="1391,460 1399,460 1399,326 1395,320 1391,326" fill={WING} />
      <rect x={1397} y={326} width={2} height={134} fill="rgba(0,20,60,.18)" />

      {/* ── Spire ── */}
      <polygon points={`${cx-halfTop},${bodyTopY} ${cx+halfTop},${bodyTopY} ${cx},${spireTipY}`} fill={SPIRE} />
      <line x1={cx} y1={bodyTopY} x2={cx} y2={spireTipY} stroke="rgba(0,20,60,.15)" strokeWidth={1} />

      {/* ── Mast + aircraft warning light ── */}
      <rect x={cx - 1.5} y={spireTipY - 18} width={3} height={18} fill={MAST} />
      <circle cx={cx} cy={spireTipY - 20} r={2.4} fill="#e8503c" />
      <circle cx={cx} cy={spireTipY - 20} r={4.5} fill="rgba(232,80,60,.3)" />
    </g>
  );
}

/** Back-compat alias — this silhouette is the Transamerica Pyramid. */
export const CoitTower = TransamericaPyramid;