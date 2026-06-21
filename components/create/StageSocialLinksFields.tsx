'use client';

import type { CSSProperties } from 'react';
import {
  limitSocialLinkInput,
  STAGE_SOCIAL_LINK_FIELDS,
  STAGE_SOCIAL_LINKS_HINT,
  type StageSocialLinks,
} from '@/lib/stages/socialLinks';

const INPUT: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 13,
  color: '#fff',
  outline: 'none',
  fontFamily: 'system-ui,sans-serif',
};

const LABEL: CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'rgba(255,255,255,0.68)',
  fontFamily: 'system-ui,sans-serif',
  fontWeight: 500,
  marginBottom: 6,
};

type Props = {
  values: StageSocialLinks;
  onChange: (next: StageSocialLinks) => void;
  disabled?: boolean;
  invalid?: boolean;
  compact?: boolean;
};

export function StageSocialLinksFields({
  values,
  onChange,
  disabled = false,
  invalid = false,
  compact = false,
}: Props) {
  return (
    <div style={{ marginTop: compact ? 0 : 4 }}>
      <p style={{
        margin: compact ? '0 0 10px' : '0 0 12px',
        fontSize: 11,
        lineHeight: 1.45,
        color: 'rgba(255,255,255,0.45)',
      }}
      >
        {STAGE_SOCIAL_LINKS_HINT}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 12 }}>
        {STAGE_SOCIAL_LINK_FIELDS.map(field => (
          <div key={field.kind}>
            <label style={LABEL}>{field.label}</label>
            <input
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              disabled={disabled}
              placeholder={field.placeholder}
              value={values[field.kind] ?? ''}
              onChange={e => {
                const next = { ...values };
                const value = limitSocialLinkInput(e.target.value);
                if (value) next[field.kind] = value;
                else delete next[field.kind];
                onChange(next);
              }}
              style={{
                ...INPUT,
                border: invalid
                  ? '1px solid rgba(255,107,107,0.55)'
                  : INPUT.border,
                padding: compact ? '8px 10px' : INPUT.padding,
                fontSize: compact ? 12 : INPUT.fontSize,
                borderRadius: compact ? 8 : INPUT.borderRadius,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
