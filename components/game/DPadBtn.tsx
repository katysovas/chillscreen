type DPadBtnProps = {
  label: string;
  onStart: () => void;
  onEnd: () => void;
};

export function DPadBtn({ label, onStart, onEnd }: DPadBtnProps) {
  return (
    <button
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onStart();
      }}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,.2)',
        background: 'rgba(0,0,0,.35)',
        backdropFilter: 'blur(6px)',
        color: 'rgba(255,255,255,.6)',
        fontSize: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
