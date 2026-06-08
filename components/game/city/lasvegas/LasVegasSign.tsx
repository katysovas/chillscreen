import { VEGAS_GND } from './constants';

const SIGN_SRC = '/images/lasvegas.svg';
/** Native artboard 364×460.5 — scaled for mid-layer. */
const SIGN_W = 220;
const SIGN_H = (460.5 / 364.04) * SIGN_W;

/** Classic welcome sign — left of the Vegas Sphere on Strip tiles. */
export function LasVegasSign({ x = 1150 }: { x?: number }) {
  const footY = VEGAS_GND;
  const signX = x - SIGN_W / 2;
  const signY = footY - SIGN_H;

  return (
    <g aria-label="Welcome to Las Vegas">
      <line
        x1={x - SIGN_W / 2 + 24}
        y1={footY}
        x2={x - SIGN_W / 2 + 24}
        y2={signY + 48}
        stroke="#4a4460"
        strokeWidth={6}
      />
      <line
        x1={x + SIGN_W / 2 - 24}
        y1={footY}
        x2={x + SIGN_W / 2 - 24}
        y2={signY + 48}
        stroke="#4a4460"
        strokeWidth={6}
      />
      <image
        href={SIGN_SRC}
        x={signX}
        y={signY}
        width={SIGN_W}
        height={SIGN_H}
        preserveAspectRatio="xMidYMax meet"
      />
    </g>
  );
}
