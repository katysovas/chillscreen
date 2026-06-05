import { SD_GND, FEST_COLORS } from './constants';

/** Iconic balloon chain rising into the sky, swaying gently in the breeze. */
export function BalloonChain({ x = 1760 }: { x?: number }) {
  const balloons = Array.from({ length: 14 }, (_, i) => ({
    bx: x + Math.sin(i * 0.7) * 22,
    by: SD_GND - 40 - i * 34,
    c: FEST_COLORS[i % FEST_COLORS.length],
    r: 13 - i * 0.4,
    // Higher balloons sway a touch more and slightly out of phase.
    amp: 1.4 + i * 0.45,
    dur: 4.8 + (i % 4) * 0.7,
    del: (i % 5) * 0.4,
  }));

  return (
    <g>
      {/* Whole bunch rocks slowly around the tether anchor on the ground. */}
      <animateTransform
        attributeName="transform"
        type="rotate"
        values={`-1.6 ${x} ${SD_GND}; 1.6 ${x} ${SD_GND}; -1.6 ${x} ${SD_GND}`}
        dur="7s"
        repeatCount="indefinite"
        calcMode="spline"
        keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
        keyTimes="0; 0.5; 1"
      />
      <path
        d={`M${x},${SD_GND} ${balloons.map(b => `L${b.bx},${b.by}`).join(' ')}`}
        fill="none"
        stroke="rgba(80,80,90,.4)"
        strokeWidth={1}
      />
      {balloons.map((b, i) => (
        <g key={i}>
          {/* Per-balloon micro-sway layered on top of the bunch rotation. */}
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${-b.amp},0; ${b.amp},0; ${-b.amp},0`}
            dur={`${b.dur}s`}
            begin={`${b.del}s`}
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            keyTimes="0; 0.5; 1"
          />
          <ellipse cx={b.bx} cy={b.by} rx={b.r} ry={b.r * 1.15} fill={b.c} />
          <ellipse
            cx={b.bx - b.r * 0.3}
            cy={b.by - b.r * 0.4}
            rx={b.r * 0.3}
            ry={b.r * 0.4}
            fill="rgba(255,255,255,.4)"
          />
        </g>
      ))}
    </g>
  );
}
