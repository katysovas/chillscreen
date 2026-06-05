type SunProps = {
  cx: number;
  cy: number;
  core: string;
  glow: string;
};

export function Sun({ cx, cy, core, glow }: SunProps) {
  return (
    <>
      <circle cx={cx} cy={cy} r={52} fill={core} />
      <circle cx={cx} cy={cy} r={82} fill={glow} filter="url(#sunf)" />
      <circle cx={cx} cy={cy} r={125} fill={glow} opacity={0.45} filter="url(#sunf2)" />
    </>
  );
}
