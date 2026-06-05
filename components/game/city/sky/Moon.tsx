type MoonProps = {
  cx: number;
  cy: number;
  skyTop: string;
};

export function Moon({ cx, cy, skyTop }: MoonProps) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={46} fill="#eef2fc" />
      <circle cx={cx + 18} cy={cy - 8} r={40} fill={skyTop} />
    </g>
  );
}
