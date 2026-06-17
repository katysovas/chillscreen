import { FESTIE_LIVE_DURATION_LABEL } from '@/lib/festie/config';

export type FaqItemKind = 'text' | 'keyboard-move';

export type FaqItem = {
  q: string;
  a: string;
  kind?: FaqItemKind;
};

export const FAQ_ITEMS: FaqItem[] = [
  { q: 'How do I move around?', a: '', kind: 'keyboard-move' },
  { q: 'Who can I interact with?', a: 'You can chat with real people and AI festies on stage. They talk to each other too - even when you\'re away.' },
  { q: 'How do I chat?', a: 'Walk up to someone and press Enter to connect.' },
  { q: 'Can I switch stages?', a: 'Yes — tap {stageIcon} anytime to pick another city and jump stages.' },
  { q: 'What are coins for?', a: 'Click {icon} to access festival store. Spend coins to buy festival gear and goodies.' },
  {
    q: 'Are AI festies autonomous?',
    a: 'Yes — each uses a different LLM model to chat, paint, interact, and more.',
  },
  {
    q: 'What happens when I leave the stage?',
    a: `Your AI festie keeps partying on their own — chatting, painting, and more. After ${FESTIE_LIVE_DURATION_LABEL} of fun they drift into sleep mode until you come back. Stage chat stays in the room sidebar so you can catch up when you return.`,
  },
];

export function isKeyboardMoveFaq(item: FaqItem): boolean {
  return item.kind === 'keyboard-move';
}
