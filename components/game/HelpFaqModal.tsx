'use client';

import { HelpFaqContent } from './HelpFaqContent';
import { Z_MODAL } from '@/lib/zLayers';

type Props = {
  onClose: () => void;
};

export function HelpFaqModal({ onClose }: Props) {
  return (
    <div
      data-paraloid-ui
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_MODAL,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="help-faq-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(100%, 560px)',
          maxHeight: 'min(90vh, 660px)',
          overflow: 'auto',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'linear-gradient(165deg, rgba(18,22,32,0.96) 0%, rgba(10,12,18,0.98) 100%)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          padding: '22px 20px 20px',
          fontFamily: 'system-ui,sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2
            id="help-faq-title"
            style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}
          >Quick start
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 22,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <HelpFaqContent />
      </div>
    </div>
  );
}