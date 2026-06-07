import type { LoadoutRenderCtx } from '../types';

type BottomVariant = 'shorts' | 'jeans' | 'dress';

type BottomPropProps = {
  variant?: BottomVariant;
  ctx: LoadoutRenderCtx;
};

function resolveVariant(ctx: LoadoutRenderCtx, fallback: BottomVariant = 'shorts'): BottomVariant {
  const style = ctx.props.style;
  if (style === 'shorts' || style === 'jeans' || style === 'dress') return style;
  return fallback;
}

/** Pants, shorts, or full dress (dress also covers torso). */
export function BottomProp({ variant, ctx }: BottomPropProps) {
  const resolved = variant ?? resolveVariant(ctx);
  const color = ctx.props.color ?? '#3d4f6f';

  return (
    <div
      className={`ch-lo-bottom ch-lo-bottom-${resolved}`}
      style={{ ['--lo-color' as string]: color }}
    />
  );
}
