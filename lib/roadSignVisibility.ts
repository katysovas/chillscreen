import { signParallaxOverlapsStage } from '@/lib/signPlacement';

/** Hide junction signs that parallax over a stage — imperative, no React re-renders. */
export function updateRoadSignVisibility(
  signsSvg: SVGSVGElement | null,
  worldOff: number,
) {
  if (!signsSvg) return;
  const signs = signsSvg.querySelectorAll<SVGGElement>('[data-road-sign]');
  for (let i = 0; i < signs.length; i++) {
    const el = signs[i]!;
    const tile = Number(el.dataset.signTile);
    const x = Number(el.dataset.signX);
    if (!Number.isFinite(tile) || !Number.isFinite(x)) continue;
    const hidden = signParallaxOverlapsStage(tile, x, worldOff);
    el.style.visibility = hidden ? 'hidden' : 'visible';
  }
}
