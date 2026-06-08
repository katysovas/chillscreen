import { forwardRef, memo } from 'react';
import { GND_F } from '@/lib/parallax';
import { staticCabanaPlacements } from '@/lib/cabanas';
import { VipCabana } from './cabana/VipCabana';
import { DECORATIVE_SHAPE, PARALLAX_LAYER_BASE } from './shared/parallaxLayerStyle';

type CabanaForegroundLayerProps = {
  /** Initial viewBox only — scroll updates run imperatively on the ref. */
  worldOff: number;
};

const CABANAS = staticCabanaPlacements();

/** VIP cabanas above street/trees — ground parallax, fixed world positions. */
export const CabanaForegroundLayer = memo(forwardRef<SVGSVGElement, CabanaForegroundLayerProps>(
  function CabanaForegroundLayer({ worldOff }, ref) {
    const vx = worldOff * GND_F;

    return (
      <svg
        ref={ref}
        viewBox={`${vx} 0 1400 900`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="optimizeSpeed"
        style={{
          ...PARALLAX_LAYER_BASE,
          zIndex: 8,
          pointerEvents: 'none',
        }}
      >
        <g {...DECORATIVE_SHAPE}>
          {CABANAS.map(p => (
            <VipCabana key={p.id} placement={p} />
          ))}
        </g>
      </svg>
    );
  },
));
