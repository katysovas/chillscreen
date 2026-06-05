/** Window grid rects for glass towers. */
export function winGrid(x: number, y: number, w: number, h: number, col: string) {
  return Array.from({ length: Math.floor((h - 12) / 20) }, (_, r) =>
    Array.from({ length: Math.floor((w - 10) / 14) }, (_, c) => (
      <rect
        key={`${r}-${c}`}
        x={x + 7 + c * 14}
        y={y + 9 + r * 20}
        width={9}
        height={12}
        rx={1}
        fill={col}
        opacity={(r + c) % 5 === 0 ? 0.25 : 0.6}
      />
    )),
  ).flat();
}
