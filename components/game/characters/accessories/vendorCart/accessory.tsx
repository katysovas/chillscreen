export function VendorCartAccessory({
  color = '#e8520a',
  emoji = '🛍️',
}: {
  color?: string;
  emoji?: string;
}) {
  return (
    <div
      className="ch-vcart-wrap"
      style={{ ['--cart-awning' as string]: color }}
    >
      <div className="ch-vcart-pole" />
      <div className="ch-vcart-awning" />
      <div className="ch-vcart-body">
        <div className="ch-vcart-display" aria-hidden>{emoji}</div>
      </div>
      <div className="ch-vcart-shelf" />
      <div className="ch-vcart-handle" />
      <div className="ch-vcart-wheel ch-vcart-wheel-l" />
      <div className="ch-vcart-wheel ch-vcart-wheel-r" />
    </div>
  );
}
