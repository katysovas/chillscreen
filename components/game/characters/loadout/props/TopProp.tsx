import type { LoadoutRenderCtx } from '../types';

type TopPropProps = {
  variant: 'tee' | 'tank' | 'tie-dye';
  ctx: LoadoutRenderCtx;
};

/** Shirts / tops — torso overlay on the body. */
export function TopProp({ variant, ctx }: TopPropProps) {
  const color = ctx.props.color ?? '#4a90d9';
  const accent = ctx.props.accentColor ?? '#e85074';

  return (
    <div
      className={`ch-lo-top ch-lo-top-${variant}`}
      style={{
        ['--lo-color' as string]: color,
        ['--lo-accent' as string]: accent,
      }}
    >
      {variant === 'tee' && (
        <>
          <span className="ch-lo-top-sleeve ch-lo-top-sleeve-l" />
          <span className="ch-lo-top-sleeve ch-lo-top-sleeve-r" />
        </>
      )}
    </div>
  );
}
