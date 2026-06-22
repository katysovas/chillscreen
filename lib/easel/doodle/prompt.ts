/** Text-to-image prompt for NPC easel doodles. */

export function buildDoodleImagePrompt(subject: string, bgHex: string): string {
  return [
    `${subject}, single centered object, pixel art sprite,`,
    'thick silhouette, large object fills 70% of frame, symmetrical front view,',
    'flat colors, hard edges, no anti-aliasing, no gradients,',
    `no background (solid ${bgHex}), no text, no shadow,`,
    'limited palette, retro 16-bit game asset',
  ].join('\n');
}
