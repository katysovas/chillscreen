const HEADPHONES_SRC = '/images/props/headphones.svg';

export function DjHeadphones({ color = '#2c2c34' }: { color?: string }) {
  return (
    <div
      className="ch-dj-phones"
      style={{ ['--dj-phone-color' as string]: color }}
    >
      <img
        src={HEADPHONES_SRC}
        alt=""
        className="ch-dj-phones-img"
        draggable={false}
      />
    </div>
  );
}

export function DjSpeaker({ color = '#e04f8e' }: { color?: string }) {
  return (
    <div
      className="ch-dj-speaker"
      style={{ ['--dj-speaker-color' as string]: color }}
    >
      <div className="ch-boom-handle" />
      <div className="ch-boom-body">
        <div className="ch-boom-woofer ch-boom-woofer-l" />
        <div className="ch-boom-center">
          <div className="ch-boom-tape" />
          <div className="ch-boom-panel" />
        </div>
        <div className="ch-boom-woofer ch-boom-woofer-r" />
      </div>
      <div className="ch-boom-grip" />
    </div>
  );
}
