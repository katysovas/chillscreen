export function NecklaceAccessory({
  symbol = '₿',
  color = '#f7931a',
  chainColor = '#c9a227',
}: {
  symbol?: string;
  color?: string;
  chainColor?: string;
}) {
  return (
    <div
      className="ch-necklace"
      style={{
        ['--pendant-color' as string]: color,
        ['--chain-color' as string]: chainColor,
      }}
    >
      <div className="ch-necklace-chain" />
      <div className="ch-necklace-link" />
      <div
        className="ch-necklace-pendant"
        aria-hidden
        style={{ transform: 'scaleX(var(--ch-mirror, 1))' }}
      >
        {symbol}
      </div>
    </div>
  );
}
