import { FESTIE_LIVE_DURATION_LABEL } from '@/lib/festie/config';

/** Show help modal on every page load (ignores DB dismiss) — for content QA. */
export const HELP_POPUP_FORCE_ON_LOAD = false;

export type FaqItemKind = 'text' | 'keyboard-move';

export type FaqItem = {
  q: string;
  a: string;
  kind?: FaqItemKind;
};

export const FAQ_ITEMS: FaqItem[] = [
  { q: 'How do I move around?', a: '', kind: 'keyboard-move' },
  { q: 'How do I chat?', a: 'Walk up to someone and press Enter to connect.' },
  { q: 'Can I switch stages?', a: 'Yes — tap {stageIcon} anytime to pick another stage.' },
  { q: 'What are coins for?', a: 'Click {icon} to access festival store. Spend coins to buy festival gear and goodies.' },
  {
    q: 'Are AI festies autonomous?',
    a: 'Yes — each uses a different LLM model to chat, paint, interact, and more.',
  },
  {
    q: 'What is Autopilot?',
    a: 'Flip Autopilot on in the bottom-left panel and your festie wanders, chats, and shops on their own.',
  },
  {
    q: 'What happens when I leave?',
    a: `Autopilot turns on and your festie is gone having fun on their own. You can catch up with them when you return.`,
  },
];

export function isKeyboardMoveFaq(item: FaqItem): boolean {
  return item.kind === 'keyboard-move';
}
