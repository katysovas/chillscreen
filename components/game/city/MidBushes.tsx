import { skipMidBush } from '@/lib/stageTreeExclusion';
import { DECORATIVE_SHAPE } from './shared/parallaxLayerStyle';

/** Ridge trees east of the bridge, near the downtown skyline. */
const MID_BUSH_XS = [980, 1280, 1520, 1880, 2120, 2380];

/** Small trees along the mid-layer ridge. */
export function MidBushes() {
  return (
    <g {...DECORATIVE_SHAPE}>
      {MID_BUSH_XS.filter(x => !skipMidBush(x)).map((x, i) => (
        <g
          key={x}
          transform={`translate(${x},660)`}
          style={{
            animation: `sw${1 + (i % 3)} ${5 + i * 0.8}s ease-in-out infinite`,
            transformOrigin: '0 0',
            animationDelay: `${i * 0.6}s`,
          }}
        >
          <rect x={-5} y={-80} width={10} height={80} fill="#3a2a18" rx={2} />
          <circle cx={0} cy={-80} r={36} fill="#1e5c1e" />
          <circle cx={-18} cy={-68} r={26} fill="#246024" />
          <circle cx={18} cy={-72} r={28} fill="#206420" />
          <circle cx={0} cy={-98} r={20} fill="#288028" opacity={0.7} />
        </g>
      ))}
    </g>
  );
}
