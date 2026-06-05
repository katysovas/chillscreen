export type SkyPeriod = 'night' | 'morning' | 'day' | 'evening';

/** Local browser hour → sky period. */
export function getSkyPeriod(date = new Date()): SkyPeriod {
  const h = date.getHours();
  if (h >= 21 || h < 5) return 'night';
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  return 'evening';
}

export type SkyGradientStop = { offset: string; color: string };

export type SkyTheme = {
  gradient: SkyGradientStop[];
  haze: string;
  horizon: string;
  cloudVariant: 'day' | 'warm' | 'dim';
  birdStroke: string;
  showClouds: boolean;
  showStars: boolean;
  sun?: { cx: number; cy: number; core: string; glow: string };
  moon?: { cx: number; cy: number };
};

// cx/cy are in sky-tile space (0..2000 × 0..900) used by SkyCloudsLayer.
// At most one sun/moon is visible at a time — tile width (2000) > viewport (1400).
const SKY_THEMES: Record<SkyPeriod, SkyTheme> = {
  night: {
    gradient: [
      { offset: '0%', color: '#040812' },
      { offset: '42%', color: '#0c1428' },
      { offset: '100%', color: '#182040' },
    ],
    haze: 'rgba(120,140,180,.06)',
    horizon: 'rgba(40,55,90,.18)',
    cloudVariant: 'dim',
    birdStroke: '#1a2848',
    showClouds: false,
    showStars: true,
    moon: { cx: 1160, cy: 98 },
  },
  morning: {
    gradient: [
      { offset: '0%', color: '#5a7898' },
      { offset: '32%', color: '#d8a088' },
      { offset: '62%', color: '#f0d080' },
      { offset: '100%', color: '#e8f0fa' },
    ],
    haze: 'rgba(255,220,180,.14)',
    horizon: 'rgba(255,210,170,.22)',
    cloudVariant: 'warm',
    birdStroke: '#4a5878',
    showClouds: true,
    showStars: false,
    sun: { cx: 360, cy: 255, core: '#ffe8a0', glow: 'rgba(255,210,120,.28)' },
  },
  day: {
    gradient: [
      { offset: '0%', color: '#18509a' },
      { offset: '38%', color: '#3878cc' },
      { offset: '72%', color: '#7ab8e8' },
      { offset: '100%', color: '#c0daf4' },
    ],
    haze: 'rgba(200,225,248,.16)',
    horizon: 'rgba(185,208,230,.2)',
    cloudVariant: 'day',
    birdStroke: '#2a4070',
    showClouds: true,
    showStars: false,
    sun: { cx: 1100, cy: 105, core: '#ffe760', glow: 'rgba(255,240,80,.24)' },
  },
  evening: {
    gradient: [
      { offset: '0%', color: '#1a2048' },
      { offset: '28%', color: '#5a3888' },
      { offset: '58%', color: '#c86848' },
      { offset: '100%', color: '#f0a858' },
    ],
    haze: 'rgba(255,180,120,.12)',
    horizon: 'rgba(220,150,100,.24)',
    cloudVariant: 'warm',
    birdStroke: '#3a2858',
    showClouds: true,
    showStars: true,
    sun: { cx: 1240, cy: 305, core: '#ffb050', glow: 'rgba(255,140,60,.22)' },
  },
};

export function skyTheme(period: SkyPeriod): SkyTheme {
  return SKY_THEMES[period];
}

/** Fixed star field — screen-space coords (1400 × 620 upper sky area). */
export const STAR_FIELD = Array.from({ length: 88 }, (_, i) => ({
  x: (i * 173 + 47) % 1400,
  y: 8 + (i * 89) % 580,
  r: 0.55 + (i % 4) * 0.5,
  opacity: 0.32 + (i % 6) * 0.11,
}));
