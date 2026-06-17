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
  /** OpenRouter model override (optional). */
  modelId?: string;
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
  'deep-space': { stageName: 'Deep Space', city: 'The Orbit', vibe: 'cosmic orbit deck, floating planets, chill stargazers' },
  'outside-lands': { stageName: 'San Francisco Stage', city: 'San Francisco', vibe: 'street-side concert stage, fog rolling in' },
  bumbershoot: { stageName: 'Seattle Stage', city: 'Seattle', vibe: 'city park festival, Pacific Northwest crowd' },
  coachella: { stageName: 'The Desert Stage', city: 'Southern California', vibe: 'desert festival main stage, golden-hour dust' },
  edc: { stageName: 'Vegas Stage', city: 'Las Vegas', vibe: 'neon electric dance carnival, sensory overload' },
  'which-stage': { stageName: 'The Farm', city: 'The Farm', vibe: 'campground festival, jam-band energy' },
  forest: { stageName: 'The Forest Stage', city: 'The Forest', vibe: 'glowing woods rave, fireflies and lasers' },
  'silent-disco': { stageName: 'Silent Disco', city: 'Silent Disco', vibe: 'headphone rave under a dark sky, glowsticks everywhere' },
  hula: { stageName: 'Hulaween', city: 'Suwannee', vibe: 'Halloween forest festival, full sets and bass under the oaks' },
};

/** Hardcoded cast — generated NPCs must not reuse these names. */
export function existingCastNames(): string[] {
  return CHARACTERS.map(c => c.name.toLowerCase());
}

/** Keep first occurrence per name — prevents duplicate React keys / NPC ids. */
export function dedupeGeneratedNpcs(npcs: GeneratedNpc[]): GeneratedNpc[] {
  const seen = new Set<string>();
  return npcs.filter((n): n is GeneratedNpc => {
    if (!n?.name || !n.archetype) return false;
    const key = n.name.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
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
Players wander city stages and watch live shows. NPCs are ambient crowd
characters in pair conversations — dialogue is generated live from seeds,
not pre-written lines.

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
      "personalityNotes": string // 2-4 sentences for LLM pair chatter — see below
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

CHARACTER
- Each NPC has one specific, mundane fixation: the bathroom line, a rumor
  about a secret set, their phone battery, a guy named greg they keep
  almost seeing.
- personalityNotes: voice + fixation for live LLM chatter. Write like this —
  "Undercover festival cop who thinks he is blending in and is not.
   Deadpan reddit-at-a-festival tone. Fixated on spotting fake wristbands.
   Wink-nudge comedy only, never threatening."
- prop: pick one that fits the character, or null. Roughly half should
  be null. Never invent props not in the list.
- Comedy only. Nothing threatening, edgy, political, or horny. No drug
  references. Safe for a general audience but not sanitized into corporate.

VARIETY
- Mix archetypes; no more than ${Math.ceil(count / 3)} of any one archetype.
- No two NPCs with the same fixation.`;
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
    const personalityNotes = typeof npc.personalityNotes === 'string' ? npc.personalityNotes.trim() : '';
    if (!personalityNotes) {
      throw new Error(`npc[${i}] (${npc.name}): missing personalityNotes`);
    }
    return {
      name: npc.name.toLowerCase().trim(),
      archetype: npc.archetype,
      outfit: typeof npc.outfit === 'string' ? npc.outfit : 'none',
      prop: typeof npc.prop === 'string' && NPC_PROPS.includes(npc.prop) ? npc.prop : null,
      vibe: typeof npc.vibe === 'string' ? npc.vibe : '',
      personalityNotes,
    };
  });
}
