import { HatProp } from '../loadout/props/HatProp';

const PIRATE_HAT_CTX = { balloonColor: '#000', props: {} } as const;

/** SVG tricorn + eyepatch, gold earring, baggy pants. Render inside .ch-body before the face. */
export function PirateHeadAccessory() {
  return (
    <>
      <HatProp variant="pirate-hat" ctx={PIRATE_HAT_CTX} />
      <div className="ch-eyepatch" />
      <div className="ch-pirate-earring" />
      <div className="ch-pirate-pants" />
    </>
  );
}

/** Cutlass — render inside .ch-right-hand. */
export function PirateSwordAccessory() {
  return (
    <div className="ch-sword">
      <div className="ch-sword-blade" />
      <div className="ch-sword-guard" />
      <div className="ch-sword-hilt" />
    </div>
  );
}
