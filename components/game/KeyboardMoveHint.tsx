'use client';

const HUD_KEY_STYLE: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,.2)',
  background: 'rgba(0,0,0,.3)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,.45)',
  fontSize: 14,
  flexShrink: 0,
  fontFamily: 'system-ui,sans-serif',
  lineHeight: 1,
};

const HELP_KEY_STYLE: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,.32)',
  background: 'rgba(255,255,255,.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,.88)',
  fontSize: 13,
  flexShrink: 0,
  fontFamily: 'system-ui,sans-serif',
  lineHeight: 1,
};

type Props = {
  showLegend?: boolean;
  variant?: 'hud' | 'help';
};

/** Arrow-key chips + optional A/D/W legend — matches bottom-right HUD. */
export function KeyboardMoveHint({ showLegend = true, variant = 'hud' }: Props) {
  const help = variant === 'help';
  const keyStyle = help ? HELP_KEY_STYLE : HUD_KEY_STYLE;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {(['←', '→', '↑'] as const).map(k => (
        <div key={k} style={keyStyle} aria-hidden>
          {k}
        </div>
      ))}
      {showLegend && (
        <div style={{
          color: help ? 'rgba(255,255,255,.62)' : 'rgba(255,255,255,.2)',
          fontSize: help ? 10 : 9,
          letterSpacing: help ? 2 : 3,
          fontFamily: 'Georgia,serif',
        }}>
          A · D · W · walk & jump
        </div>
      )}
    </div>
  );
}
