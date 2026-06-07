import type { LoadoutRenderCtx } from '../types';

type BottomPropProps = {
  variant: 'shorts' | 'jeans' | 'dress';
  ctx: LoadoutRenderCtx;
};

/** Pants, shorts, or full dress (dress also covers torso). */
export function BottomProp({ variant, ctx }: BottomPropProps) {
  const color = ctx.props.color ?? '#3d4f6f';

  return (
    <div
      className={`ch-lo-bottom ch-lo-bottom-${variant}`}
      style={{ ['--lo-color' as string]: color }}
    />
  );
}
