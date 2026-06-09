type DPadBtnProps = {
  label: string;
  onStart: () => void;
  onEnd: () => void;
};

export function DPadBtn({ label, onStart, onEnd }: DPadBtnProps) {
  return (
    <button
      type="button"
      aria-label={label === '←' ? 'Move left' : label === '→' ? 'Move right' : 'Jump'}
      onPointerDown={e => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onStart();
      }}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      style={{
        width: 64,
        height: 64,
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,.22)',
        background: 'rgba(0,0,0,.42)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        color: 'rgba(255,255,255,.65)',
        fontSize: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}
