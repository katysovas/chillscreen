export function BalloonAccessory({ color }: { color: string }) {
  return (
    <div className="ch-ballons">
      <div className="ch-heart">
        <span style={{ background: color }} />
        <span style={{ background: color }} />
      </div>
    </div>
  );
}
