/** Random opener stance for npcA — forces divergent takes, not agreement loops. */
const OPENING_STANCES = [
  'your angle: everyone is being way too nice about this and it\'s embarrassing',
  'your angle: this is actually a disaster and people are coping',
  'your angle: only tourists and influencers are surprised — real heads saw this coming',
  'your angle: say the quiet part out loud, even if it ruffles feathers',
  'your angle: this is lowkey hilarious if you stop pretending to care',
  'your angle: the mainstream take is wrong and you know why',
  'your angle: defend the unpopular side — commit to the bit',
  'your angle: call out the grift/scam/hype directly, no softening',
  'your angle: this is why you never trust the first take on the internet',
  'your angle: make an absurd comparison that somehow makes perfect sense',
];

export function pickOpeningStance(): string {
  return OPENING_STANCES[Math.floor(Math.random() * OPENING_STANCES.length)]!;
}
