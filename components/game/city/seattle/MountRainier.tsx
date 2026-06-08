// All path strings pre-computed at module load — never recomputed on render.
import { DECORATIVE_SHAPE } from '../shared/parallaxLayerStyle';

const PEAK_X = 1855;
const PEAK_Y = 268;

const BASE_PATH =
  `M1235,578 Q1500,508 1655,422 Q1770,344 ${PEAK_X},${PEAK_Y}` +
  ` Q1948,344 2065,422 Q2235,508 2498,578 Z`;

const SNOW_PATH =
  `M1640,452 Q1700,392 1762,346 Q1812,302 ${PEAK_X},${PEAK_Y}` +
  ` Q1900,302 1952,350 Q2014,396 2074,456` +
  ` L2030,442 L1992,458 L1948,440 L1906,456 L1868,440` +
  ` L1840,456 L1800,440 L1758,458 L1716,440 L1678,456 Z`;

const RIDGE_L = `M${PEAK_X},288 L1846,430`;
const GLACIER_ARC = `M1820,300 Q${PEAK_X},${PEAK_Y} 1892,302`;

/**
 * Mount Rainier — broad snow-capped stratovolcano backdrop.
 *
 * NO opaque body fill is used here.  A solid fill of the mountain silhouette
 * would paint a specific grey colour over the SkyLayer gradient, creating a
 * visible tile-boundary seam in the sky.  Instead:
 *   • Only the snow cap (SNOW_PATH) has an opaque fill — it is white and reads
 *     naturally against any sky colour.
 *   • A 28 % translucent overlay on the body adds the faintest haze without
 *     altering the sky hue enough to form a seam.
 *   • Ridge and glacier lines give the peak its 3-D form.
 */
export function MountRainier() {
  return (
    <g {...DECORATIVE_SHAPE}>
      {/* Translucent atmospheric body — does NOT cover the sky with an opaque hue */}
      <path d={BASE_PATH} fill="rgba(202,216,236,.18)" />
      {/* Snow cap — opaque white, reads against any sky */}
      <path d={SNOW_PATH} fill="#eef2f8" />
      {/* Ridge definition lines */}
      <path d={RIDGE_L}     stroke="#e2e9f3" strokeWidth={6} opacity={0.7} />
      <path d="M1812,332 L1792,432" stroke="#e2e9f3" strokeWidth={4} opacity={0.6} />
      <path d="M1900,332 L1918,432" stroke="#e2e9f3" strokeWidth={4} opacity={0.6} />
      <path d={GLACIER_ARC} stroke="rgba(255,236,210,.5)" strokeWidth={3} fill="none" />
    </g>
  );
}
