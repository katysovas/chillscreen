'use client';

/** Soft pulsing aura — full strength for chat connect; subtle for always-on player ID. */
export function ChatConnectGlow({
  active,
  subtle = false,
  color = '#8ed4ff',
}: {
  active: boolean;
  subtle?: boolean;
  color?: string;
}) {
  if (!active) return null;

  return (
    <div
      className={`ch-chat-connect-glow${subtle ? ' ch-chat-connect-glow--subtle' : ''}`}
      aria-hidden
      style={{ ['--glow-color' as string]: color }}
    />
  );
}
