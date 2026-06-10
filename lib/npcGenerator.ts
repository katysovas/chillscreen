/** Localhost admin tool — LLM prompt + types for generating ambient NPCs. */

import CHARACTERS from '@/components/game/characters';
import type { StageChannel } from '@/lib/stageVideos';
import { VENDOR_SHOP_ITEMS } from '@/lib/vendorShop';

export type GeneratedNpc = {
  name: string;
  archetype: 'chiller' | 'dancer' | 'wanderer' | 'vendor' | 'hustler';
  outfit: string;
  prop: string | null;
  vibe: string;
  personalityNotes: string;
  lines: string[];
};

export const NPC_GENERATOR_MODEL = 'gpt-4.1-mini';

/** Outfit skins that exist as `ch-outfit-{name}` styles. */
export const NPC_OUTFITS = ['hippie', 'pirate', 'undercover-cop', 'none'] as const;

/** Store props NPCs can hold — fireworks/sticker are player-only effects. */
export const NPC_PROPS: string[] = VENDOR_SHOP_ITEMS.filter(
  id => !['party-fireworks', 'party-sticker'].includes(id),
);

/** Stage flavor for the prompt — name, city, one-line vibe. */
export const NPC_STAGE_CONTEXT: Record<StageChannel, { stageName: string; city: string; vibe: string }> = {
  cinema: { stageName: 'Chill Cinema', city: 'San Francisco', vibe: 'open-air movie night, mellow blanket crowd' },
  'outside-lands': { stageName: 'San Francisco Stage', city: 'San Francisco', vibe: 'street-side concert stage, fog rolling in' },
  bumbershoot: { stageName: 'Seattle Stage', city: 'Seattle', vibe: 'city park festival, Pacific Northwest crowd' },
  coachella: { stageName: 'The Desert Stage', city: 'Southern California', vibe: 'desert festival main stage, golden-hour dust' },
  edc: { stageName: 'Vegas Stage', city: 'Las Vegas', vibe: 'neon electric dance carnival, sensory overload' },
  'which-stage': { stageName: 'The Farm', city: 'The Farm', vibe: 'campground festival, jam-band energy' },
  forest: { stageName: 'The Forest Stage', city: 'The Forest', vibe: 'glowing woods rave, fireflies and lasers' },
  'silent-disco': { stageName: 'Silent Disco', city: 'Silent Disco', vibe: 'headphone rave under a dark sky, glowsticks everywhere' },
};

/** Hardcoded cast — generated NPCs must not reuse these names. */
export function existingCastNames(): string[] {
  return CHARACTERS.map(c => c.name.toLowerCase());
}

/** Keep first occurrence per name — prevents duplicate React keys / NPC ids. */
export function dedupeGeneratedNpcs(npcs: GeneratedNpc[]): GeneratedNpc[] {
  const seen = new Set<string>();
  return npcs.filter(n => {
    const key = n.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildNpcGeneratorPrompt(
  channel: StageChannel,
  count: number,
  extraExistingNames: string[] = [],
): string {
  const stage = NPC_STAGE_CONTEXT[channel];
  const outfits = [...NPC_OUTFITS];
  const props = NPC_PROPS;
  const existingNames = Array.from(
    new Set([...existingCastNames(), ...extraExistingNames.map(n => n.toLowerCase())]),
  );

  return `You generate background NPCs for a festival-themed multiplayer web game.
Players wander city stages, watch live shows, and overhear NPCs muttering
to themselves. NPCs are ambient crowd characters — they never talk TO
players, only near them.

STAGE CONTEXT
Stage: ${stage.stageName} (${stage.city}, ${stage.vibe})

OUTPUT
Return ONLY a JSON object, no markdown, no commentary:
{
  "npcs": [
    {
      "name": string,
      "archetype": "chiller" | "dancer" | "wanderer" | "vendor" | "hustler",
      "outfit": one of [${outfits.join(', ')}],
      "prop": one of [${props.join(', ')}] or null,
      "vibe": string,            // one-line character concept
      "personalityNotes": string, // 2-4 sentences, written like the example below
      "lines": string[]          // exactly 8 ambient lines
    }
  ]
}
Generate exactly ${count} NPCs.

NAMES
- Realistic first names only. Names real people have: maya, derek, priya,
  sam, jess, marcus, tina.
- No fantasy names, no nicknames, no usernames, no "ziggy/nova/blaze" energy.
- Lowercase.
- Do not use any of these existing names: ${existingNames.join(', ')}

VOICE — most important section
- Every NPC talks like a redditor at a festival. Casual, deadpan, a little
  too online. Thinks out loud like posting a comment nobody asked for.
- reddit tone, but never mention reddit, votes, posts, or threads.
- Short sentences only. Fragments are good.
- Lines are 2-6 words, lowercase, no punctuation needed except the rare
  question mark.
- No emojis. No exclamation marks. No hashtags. No slang that tries too hard.
- Muttered to self, never addressed at anyone. No "hey you", no questions
  aimed at players.
- Good examples:
  "this set kinda mid"
  "ok the bass is insane"
  "lost my friends again. classic"
  "$14 for a lemonade. sure"
  "source: i was there"
- Bad examples (never do these):
  "Hey there, fellow festival-goer!" (addresses player, too chipper)
  "WOOO LET'S GO!!! 🎉" (emoji, caps, exclamations)
  "What an absolutely magical evening" (too written, too long)

CHARACTER
- Each NPC has one specific, mundane fixation: the bathroom line, a rumor
  about a secret set, their phone battery, a guy named greg they keep
  almost seeing. Lines should orbit that fixation plus generic crowd talk.
- personalityNotes: write like this reference example —
  "Undercover festival cop who thinks he is blending in and is not.
   Mutters surveillance notes to himself, ambient — never addresses
   players. Wink-nudge, never threatening. comedy only."
- prop: pick one that fits the character, or null. Roughly half should
  be null. Never invent props not in the list.
- Comedy only. Nothing threatening, edgy, political, or horny. No drug
  references. Safe for a general audience but not sanitized into corporate.

VARIETY
- Mix archetypes; no more than ${Math.ceil(count / 3)} of any one archetype.
- No two NPCs with the same fixation.
- Don't reuse sentence structures across NPCs. If one says "this X kinda Y",
  nobody else uses that template.`;
}

/** Strip markdown code fences the model sometimes wraps JSON in. */
export function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
}

const ARCHETYPES = new Set(['chiller', 'dancer', 'wanderer', 'vendor', 'hustler']);

/** Parse + sanity-check the model output; throws with a useful message. */
export function parseGeneratedNpcs(raw: string): GeneratedNpc[] {
  const parsed: unknown = JSON.parse(stripCodeFences(raw));
  const npcs = (parsed as { npcs?: unknown }).npcs;
  if (!Array.isArray(npcs)) throw new Error('Response has no "npcs" array');

  return npcs.map((n, i) => {
    const npc = n as Partial<GeneratedNpc>;
    if (!npc.name || typeof npc.name !== 'string') {
      throw new Error(`npc[${i}]: missing name`);
    }
    if (!npc.archetype || !ARCHETYPES.has(npc.archetype)) {
      throw new Error(`npc[${i}] (${npc.name}): bad archetype "${npc.archetype}"`);
    }
    if (!Array.isArray(npc.lines) || npc.lines.length === 0) {
      throw new Error(`npc[${i}] (${npc.name}): missing lines`);
    }
    return {
      name: npc.name.toLowerCase().trim(),
      archetype: npc.archetype,
      outfit: typeof npc.outfit === 'string' ? npc.outfit : 'none',
      prop: typeof npc.prop === 'string' && NPC_PROPS.includes(npc.prop) ? npc.prop : null,
      vibe: typeof npc.vibe === 'string' ? npc.vibe : '',
      personalityNotes: typeof npc.personalityNotes === 'string' ? npc.personalityNotes : '',
      lines: npc.lines.filter((l): l is string => typeof l === 'string'),
    };
  });
}
