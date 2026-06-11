'use client';

/** Soft pulsing aura shown while two characters are in 1:1 connected chat. */
export function ChatConnectGlow({
  active,
  color = '#8ed4ff',
}: {
  active: boolean;
  color?: string;
}) {
  if (!active) return null;

  return (
    <div
      className="ch-chat-connect-glow"
      aria-hidden
      style={{ ['--glow-color' as string]: color }}
    />
  );
}
