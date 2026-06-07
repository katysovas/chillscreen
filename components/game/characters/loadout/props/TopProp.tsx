import type { LoadoutRenderCtx } from '../types';

type TopVariant = 'tee' | 'tank' | 'tie-dye';

type TopPropProps = {
  variant?: TopVariant;
  ctx: LoadoutRenderCtx;
};

function resolveVariant(ctx: LoadoutRenderCtx, fallback: TopVariant = 'tee'): TopVariant {
  const style = ctx.props.style;
  if (style === 'tee' || style === 'tank' || style === 'tie-dye') return style;
  return fallback;
}

/** Shirts / tops — torso overlay on the body. */
export function TopProp({ variant, ctx }: TopPropProps) {
  const resolved = variant ?? resolveVariant(ctx);
  const color = ctx.props.color ?? '#4a90d9';
  const accent = ctx.props.accentColor ?? '#e85074';

  return (
    <div
      className={`ch-lo-top ch-lo-top-${resolved}`}
      style={{
        ['--lo-color' as string]: color,
        ['--lo-accent' as string]: accent,
      }}
    >
      {resolved === 'tee' && (
        <>
          <span className="ch-lo-top-sleeve ch-lo-top-sleeve-l" />
          <span className="ch-lo-top-sleeve ch-lo-top-sleeve-r" />
        </>
      )}
    </div>
  );
}
