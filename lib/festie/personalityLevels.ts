export type PersonalityLevel = 1 | 2 | 3;

export type PersonalityTraitKey = 'energy' | 'friendliness' | 'chattiness';

export type PersonalityOption = {
  level: PersonalityLevel;
  /** Compact pill label */
  label: string;
  /** Longer tooltip */
  hint: string;
};

export type PersonalityTrait = {
  key: PersonalityTraitKey;
  label: string;
  options: PersonalityOption[];
};

/** Map stored 1–10 attribute to a friendly 3-level picker. */
export function attributeToLevel(value: number): PersonalityLevel {
  if (value <= 3) return 1;
  if (value <= 7) return 2;
  return 3;
}

/** Map 3-level picker back to stored 1–10 attribute. */
export function levelToAttribute(level: PersonalityLevel): number {
  if (level === 1) return 3;
  if (level === 2) return 6;
  return 9;
}

export const PERSONALITY_TRAITS: PersonalityTrait[] = [
  {
    key: 'energy',
    label: 'Energy',
    options: [
      { level: 1, label: 'Chill', hint: 'Couch locked — nap mode activated' },
      { level: 2, label: 'Groove', hint: 'Steady groove — human-speed shuffling' },
      { level: 3, label: 'Hype', hint: 'Full send — main stage or bust' },
    ],
  },
  {
    key: 'friendliness',
    label: 'Friendly',
    options: [
      { level: 1, label: 'Cool', hint: 'Warm-up act — side-eye from the rail' },
      { level: 2, label: 'Open', hint: 'Festival friend — shared sunscreen energy' },
      { level: 3, label: 'Hugs', hint: 'Hug distributor — will adopt your crew' },
    ],
  },
  {
    key: 'chattiness',
    label: 'Chatty',
    options: [
      { level: 1, label: 'Quiet', hint: 'Strong silent type — emoji-only era' },
      { level: 2, label: 'Talks', hint: 'Casual chinwag — will debate set times' },
      { level: 3, label: 'Yap', hint: 'Never stops talking — podcast host, unlicensed' },
    ],
  },
];
