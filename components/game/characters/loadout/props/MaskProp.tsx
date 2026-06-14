import type { LoadoutRenderCtx } from '../types';

const MASK_SRC = {
  'mask-1': '/images/props/mask_1.svg',
  'mask-2': '/images/props/mask_2.svg',
  'mask-3': '/images/props/mask_3.svg',
  'mask-6': '/images/props/mask_6.svg',
  'mask-mando': '/images/props/mask_mando.svg',
  'mask-gasmask': '/images/props/mask_gasmask.svg',
  'mask-astronaut': '/images/props/mask_astronaut.svg',
} as const;

const MASK_CLASS = {
  'mask-1': 'ch-lo-mask-1',
  'mask-2': 'ch-lo-mask-2',
  'mask-3': 'ch-lo-mask-3',
  'mask-6': 'ch-lo-mask-6',
  'mask-mando': 'ch-lo-mask-mando',
  'mask-gasmask': 'ch-lo-mask-gasmask',
  'mask-astronaut': 'ch-lo-mask-astronaut',
} as const;

type MaskVariant = keyof typeof MASK_SRC;

type MaskPropProps = {
  variant: MaskVariant;
  ctx: LoadoutRenderCtx;
};

/** Face masks — overlay on the nose and mouth. */
export function MaskProp({ variant }: MaskPropProps) {
  return (
    <div className={`ch-lo-mask ${MASK_CLASS[variant]}`}>
      <img
        src={MASK_SRC[variant]}
        alt=""
        className="ch-lo-mask-img"
        draggable={false}
      />
    </div>
  );
}
