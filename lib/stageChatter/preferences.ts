/** Stage chatter sender helpers. */

const LEGACY_HUMANS_ONLY_KEY = 'whichstage.stageChatter.humansOnly';

/** Remove obsolete humans-only preference — filtering was removed. */
export function clearLegacyStageChatterPrefs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_HUMANS_ONLY_KEY);
  } catch {
    // private mode
  }
}

export function isNpcStageChatterSender(sender: string): boolean {
  return sender.startsWith('npc:');
}
