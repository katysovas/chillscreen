const SUPPORT_SRC = '/images/props/support.svg';

/** Support badge floating above the head. */
export function SupportHeadAccessory() {
  return (
    <div className="ch-support-badge">
      <img
        src={SUPPORT_SRC}
        alt=""
        className="ch-support-badge-img"
        draggable={false}
      />
    </div>
  );
}
