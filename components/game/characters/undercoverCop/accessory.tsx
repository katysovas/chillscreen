/** Badge + shades — obviously undercover. */
export function UndercoverCopHeadAccessory() {
  return (
    <>
      <div className="ch-cop-badge" aria-hidden>
        <span className="ch-cop-badge-star">★</span>
      </div>
      <div className="ch-cop-shades" aria-hidden>
        <span className="ch-cop-shades-lens ch-cop-shades-lens-l" />
        <span className="ch-cop-shades-lens ch-cop-shades-lens-r" />
        <span className="ch-cop-shades-bridge" />
      </div>
      <div className="ch-cop-earpiece" aria-hidden />
    </>
  );
}

/** Pocket notepad — "field notes". */
export function UndercoverCopHandAccessory() {
  return (
    <div className="ch-cop-notepad" aria-hidden>
      <div className="ch-cop-notepad-paper" />
      <div className="ch-cop-notepad-pen" />
    </div>
  );
}
