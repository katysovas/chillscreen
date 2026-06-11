/** Random opener stance for npcA — forces divergent takes, not agreement loops. */
const OPENING_STANCES = [
  'your angle: this is overblown',
  'your angle: this changes everything and nobody\'s ready',
  'your angle: everyone\'s pretending to care but nobody will remember this',
  'your angle: the real story is what happens after, not the headline',
  'your angle: this is actually good news if you think about it',
  'your angle: classic panic — same cycle every year',
  'your angle: only the tourists are surprised',
  'your angle: this is why you never trust the first take',
];

export function pickOpeningStance(): string {
  return OPENING_STANCES[Math.floor(Math.random() * OPENING_STANCES.length)]!;
}
