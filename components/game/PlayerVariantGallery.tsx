'use client';

import Character from './Character';
import { CHAR_BOTTOM } from './groundLayout';
import { PLAYER_VARIANTS } from './playerVariants';

/** Spread positions (screen %) for test variants. */
const GALLERY_X = [30, 70] as const;

type Props = {
  walking?: boolean;
  dancing?: boolean;
};

/** Temporary — all four player skins visible at once for art review. */
export function PlayerVariantGallery({ walking = false, dancing = false }: Props) {
  return (
    <>
      {PLAYER_VARIANTS.map((variant, i) => (
        <div
          key={variant.id}
          style={{
            position: 'absolute',
            left: `${GALLERY_X[i]}%`,
            bottom: CHAR_BOTTOM,
            zIndex: 25,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Character
            walking={walking}
            facing={i % 2 === 0 ? 'right' : 'left'}
            dancing={dancing}
            scale={0.34}
            balloonColor={variant.balloonColor}
            accessory={variant.accessory}
            outfit={variant.outfit}
          />
          <div
            style={{
              marginTop: 4,
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              color: 'rgba(255,255,255,0.88)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {variant.label}
          </div>
        </div>
      ))}
    </>
  );
}
