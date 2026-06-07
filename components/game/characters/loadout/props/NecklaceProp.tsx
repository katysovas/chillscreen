import { NecklaceAccessory } from '../../accessories/necklace/accessory';
import type { LoadoutRenderCtx } from '../types';

type NecklacePropProps = {
  variant: 'pendant' | 'pearls';
  ctx: LoadoutRenderCtx;
};

/** Necklaces — reuse the existing pendant art where possible. */
export function NecklaceProp({ variant, ctx }: NecklacePropProps) {
  if (variant === 'pearls') {
    return (
      <div
        className="ch-lo-necklace ch-lo-necklace-pearls"
        style={{ ['--lo-color' as string]: ctx.props.color ?? '#f5f0e6' }}
      />
    );
  }

  return (
    <NecklaceAccessory
      symbol={ctx.props.symbol ?? '★'}
      color={ctx.props.color ?? '#f7931a'}
      chainColor={ctx.props.chainColor ?? '#c9a227'}
    />
  );
}
