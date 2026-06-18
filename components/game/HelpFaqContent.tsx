'use client';

import { FAQ_ITEMS, isKeyboardMoveFaq } from '@/lib/helpFaq';
import { SettingsIcon, ShoppingCartIcon, StageSwapIcon } from './BottomControlPanel';
import { KeyboardMoveHint } from './KeyboardMoveHint';

const ANSWER: React.CSSProperties = {
  margin: 0,
  color: 'rgba(255,255,255,0.55)',
  fontSize: 14,
  lineHeight: 1.5,
  fontFamily: 'system-ui,sans-serif',
};

const INLINE_ICON_BTN: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  verticalAlign: 'middle',
  width: 26,
  height: 26,
  margin: '0 3px',
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,.28)',
  background: 'rgba(255,255,255,.08)',
  color: 'rgba(255,255,255,.78)',
};

const FAQ_ICON_TOKEN_PATTERN = /(\{icon\}|\{stageIcon\}|\{settingsIcon\})/;

const FAQ_ICON_TOKENS: Record<string, React.ReactNode> = {
  '{icon}': (
    <span style={INLINE_ICON_BTN} aria-hidden>
      <ShoppingCartIcon size={14} />
    </span>
  ),
  '{stageIcon}': (
    <span style={INLINE_ICON_BTN} aria-hidden>
      <StageSwapIcon size={14} />
    </span>
  ),
  '{settingsIcon}': (
    <span style={INLINE_ICON_BTN} aria-hidden>
      <SettingsIcon size={14} />
    </span>
  ),
};

function FaqAnswer({ text }: { text: string }) {
  if (!FAQ_ICON_TOKEN_PATTERN.test(text)) {
    return <div style={ANSWER}>{text}</div>;
  }

  const parts = text.split(FAQ_ICON_TOKEN_PATTERN);
  return (
    <div style={ANSWER}>
      {parts.map((part, i) => (
        FAQ_ICON_TOKENS[part]
          ? <span key={i}>{FAQ_ICON_TOKENS[part]}</span>
          : part
      ))}
    </div>
  );
}

/** Shared FAQ body — used in the help popup and settings tab. */
export function HelpFaqContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {FAQ_ITEMS.map(item => (
        <div key={item.q}>
          <div style={{
            color: 'rgba(255,255,255,0.88)',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 4,
          }}>
            {item.q}
          </div>
          {isKeyboardMoveFaq(item) ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <KeyboardMoveHint variant="help" />
              <div style={{ ...ANSWER, color: 'rgba(255,255,255,0.55)' }}>Space also jumps.</div>
            </div>
          ) : (
            <FaqAnswer text={item.a} />
          )}
        </div>
      ))}
    </div>
  );
}
