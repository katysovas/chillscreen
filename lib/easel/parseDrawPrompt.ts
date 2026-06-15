const DRAW_VERB = '(?:draw|doodle|sketch|paint)';

/** Strip trailing punctuation and filler from a captured subject. */
function cleanSubject(raw: string): string | null {
  let s = raw.trim().replace(/[.!?,;:]+$/g, '').trim();
  s = s.replace(/^(?:me\s+)?(?:a|an|something)\s+/i, '').trim();
  if (!s || s.length < 2) return null;
  if (s.length > 120) s = s.slice(0, 120).trim();
  return s;
}

/**
 * Detect a player ask for an NPC to draw something in chat.
 * Examples: "draw a cat", "can you doodle the sun?", "sketch my dog"
 */
export function parseDrawPrompt(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const patterns = [
    // "draw a cat" / "please sketch something cool"
    new RegExp(
      `^(?:please\\s+)?(?:can you\\s+|could you\\s+|would you\\s+)?${DRAW_VERB}\\s+(?:me\\s+)?(?:a\\s+|an\\s+|something\\s+)?(.+)$`,
      'i',
    ),
    // "can you draw a cat?"
    new RegExp(
      `(?:can you|could you|would you|please)\\s+${DRAW_VERB}\\s+(?:me\\s+)?(?:a\\s+|an\\s+|something\\s+)?(.+)$`,
      'i',
    ),
    // "hey draw cat"
    new RegExp(`\\b${DRAW_VERB}\\s+(?:me\\s+)?(?:a\\s+|an\\s+)?(.+)$`, 'i'),
  ];

  for (const re of patterns) {
    const hit = trimmed.match(re);
    if (hit?.[1]) {
      const subject = cleanSubject(hit[1]);
      if (subject) return subject;
    }
  }

  return null;
}
