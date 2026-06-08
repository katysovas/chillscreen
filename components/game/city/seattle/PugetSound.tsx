/** Puget Sound water with curved shore and a Washington State Ferry. */
import { DECORATIVE_SHAPE } from '../shared/parallaxLayerStyle';

export function PugetSound() {
  return (
    <g {...DECORATIVE_SHAPE}>
      <path
        d="M0,584
           L448,584
           Q478,586 498,602
           Q512,618 508,636
           Q502,652 488,664
           Q468,682 442,702
           Q418,722 390,738
           L360,900
           L0,900 Z"
        fill="#8aa4b8"
      />
      <line x1={26} y1={604} x2={250} y2={604} stroke="#b2c8d6" strokeWidth={2} opacity={0.55} />
      <line x1={70} y1={620} x2={300} y2={620} stroke="#b2c8d6" strokeWidth={2} opacity={0.45} />
      <line x1={120} y1={636} x2={360} y2={636} stroke="#b2c8d6" strokeWidth={2} opacity={0.4} />
      <g>
        <rect x={150} y={600} width={120} height={22} rx={4} fill="#e6ebf0" />
        <rect x={150} y={616} width={120} height={8} rx={3} fill="#3a4450" />
        <rect x={166} y={586} width={88} height={16} rx={3} fill="#dfe5ec" />
        <rect x={172} y={590} width={76} height={7} fill="#7f93a6" />
        <rect x={206} y={574} width={10} height={14} fill="#cdd5df" />
        <ellipse cx={210} cy={628} rx={70} ry={6} fill="rgba(40,70,95,.25)" />
      </g>
    </g>
  );
}
