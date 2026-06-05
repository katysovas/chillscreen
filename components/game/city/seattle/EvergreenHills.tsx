import { firRidge } from './firRidge';

/** Layered evergreen foothills. */
export function EvergreenHills() {
  return (
    <g>
      <path d={firRidge(512, 720, 18, 46, 0)} fill="#7d94a0" opacity={0.85} />
      <path d={firRidge(540, 720, 22, 40, 1)} fill="#5a7468" />
      <path d={firRidge(572, 720, 26, 34, 2)} fill="#46604f" />
    </g>
  );
}
