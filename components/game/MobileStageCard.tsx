'use client';

type Props = {
  title: string;
  tagline: string;
  selected: boolean;
  onSelect: () => void;
};

export function MobileStageCard({ title, tagline, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: 'left',
        padding: '12px 12px 11px',
        borderRadius: 14,
        border: selected ? '2px solid #e67e22' : '1px solid rgba(255,255,255,0.14)',
        background: selected ? 'rgba(230,126,34,0.14)' : 'rgba(255,255,255,0.05)',
        cursor: 'pointer',
        fontFamily: 'system-ui,sans-serif',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
        {title}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.3 }}>
        {tagline}
      </div>
    </button>
  );
}
