import { cabanaTransform, type CabanaPlacement } from '@/lib/cabanas';
import { VipCabanaArt } from './VipCabanaArt';

/** One placed VIP cabana — reusable for city props and future user purchases. */
export function VipCabana({ placement }: { placement: CabanaPlacement }) {
  return (
    <g transform={cabanaTransform(placement)} aria-label="VIP cabana">
      <VipCabanaArt
        bannerLine1={placement.bannerLine1}
        bannerLine2={placement.bannerLine2}
        theme={placement.theme}
      />
    </g>
  );
}
