/** Stage chatter sender helpers. */

export function isNpcStageChatterSender(sender: string): boolean {
  return sender.startsWith('npc:');
}
