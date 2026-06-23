'use client';

import type { CSSProperties } from 'react';
import { StageSocialLinkIcon } from '@/components/stages/StageSocialLinkIcon';
import {
  limitSocialLinkInput,
  STAGE_SOCIAL_LINK_FIELDS,
  STAGE_SOCIAL_LINKS_HINT,
  type StageSocialLinks,
} from '@/lib/stages/socialLinks';

const INPUT: CSSProperties = {
  flex: 1,
  minWidth: 0,
  boxSizing: 'border-box',
  background: 'transparent',
  border: 'none',
  padding: '8px 10px 8px 0',
  fontSize: 12,
  color: '#fff',
  outline: 'none',
  fontFamily: 'system-ui,sans-serif',
};

type Props = {
  values: StageSocialLinks;
  onChange: (next: StageSocialLinks) => void;
  disabled?: boolean;
  invalid?: boolean;
  compact?: boolean;
  columns?: 1 | 2;
};

export function StageSocialLinksFields({
  values,
  onChange,
  disabled = false,
  invalid = false,
  compact = false,
  columns = 1,
}: Props) {
  const rowGap = compact ? 8 : 10;
  const iconSize = compact ? 16 : 18;
  const rowPadding = compact ? '0 10px' : '0 12px';
  const rowRadius = compact ? 8 : 10;

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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: columns === 2 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
          gap: rowGap,
        }}
      >
        {STAGE_SOCIAL_LINK_FIELDS.map(field => {
          const filled = Boolean(values[field.kind]?.trim());
          return (
            <label
              key={field.kind}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: rowPadding,
                borderRadius: rowRadius,
                border: invalid
                  ? '1px solid rgba(255,107,107,0.55)'
                  : filled
                    ? '1px solid rgba(255, 255, 255, 0.16)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                background: filled
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.05)',
                cursor: disabled ? 'default' : 'text',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: iconSize + 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: filled ? 1 : 0.72,
                }}
              >
                <StageSocialLinkIcon kind={field.kind} size={iconSize} />
              </span>
              <input
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                disabled={disabled}
                placeholder={field.placeholder}
                aria-label={field.label}
                value={values[field.kind] ?? ''}
                onChange={e => {
                  const next = { ...values };
                  const value = limitSocialLinkInput(e.target.value);
                  if (value) next[field.kind] = value;
                  else delete next[field.kind];
                  onChange(next);
                }}
                style={INPUT}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
