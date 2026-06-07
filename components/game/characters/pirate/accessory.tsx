/** Tricorn hat with gold band, skull ☠, animated feather plume + eyepatch
 *  and gold earring. Render inside .ch-body before the face. */
export function PirateHeadAccessory() {
  return (
    <>
      <div className="ch-pirate-hat">
        <div className="ch-pirate-hat-band" />
        <div className="ch-pirate-hat-skull">☠</div>
        <div className="ch-pirate-hat-feather" />
      </div>
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
