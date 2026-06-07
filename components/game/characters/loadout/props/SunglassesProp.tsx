import type { LoadoutRenderCtx } from '../types';

const GLASSES_SRC = {
  glasses: '/images/props/glasses.svg',
  'glasses-blue': '/images/props/glasses_blue.svg',
  'glasses-green': '/images/props/glasses_green.svg',
  'glasses-circle': '/images/props/glasses_circle.svg',
  'glasses-yellow': '/images/props/glasses_yellow.svg',
  'glasses-optic': '/images/props/glasses_optic.svg',
  'glasses-skiing': '/images/props/glasses_skiing.svg',
} as const;

const GLASSES_CLASS = {
  glasses: 'ch-lo-shades-glasses',
  'glasses-blue': 'ch-lo-shades-glasses-blue',
  'glasses-green': 'ch-lo-shades-glasses-green',
  'glasses-circle': 'ch-lo-shades-glasses-circle',
  'glasses-yellow': 'ch-lo-shades-glasses-yellow',
  'glasses-optic': 'ch-lo-shades-glasses-optic',
  'glasses-skiing': 'ch-lo-shades-glasses-skiing',
} as const;

type SvgGlassesVariant = keyof typeof GLASSES_SRC;

type SunglassesPropProps = {
  variant: 'round' | 'aviator' | SvgGlassesVariant;
  ctx: LoadoutRenderCtx;
};

/** Sunglasses — overlay on the eyes. */
export function SunglassesProp({ variant, ctx }: SunglassesPropProps) {
  const color = ctx.props.color ?? '#1a1a1a';
  const lens = ctx.props.lensColor ?? '#222';

  if (variant in GLASSES_SRC) {
    const svgVariant = variant as SvgGlassesVariant;
    return (
      <div className={`ch-lo-shades ${GLASSES_CLASS[svgVariant]}`}>
        <img
          src={GLASSES_SRC[svgVariant]}
          alt=""
          className="ch-lo-glasses-img"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`ch-lo-shades ch-lo-shades-${variant}`}
      style={{
        ['--lo-frame' as string]: color,
        ['--lo-lens' as string]: lens,
      }}
    >
      <span className="ch-lo-shades-lens" />
      <span className="ch-lo-shades-bridge" />
      <span className="ch-lo-shades-lens" />
    </div>
  );
}
