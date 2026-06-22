const MILESTONE_LINES: Record<number, string[]> = {
  25: [
    'blocking in the outline…',
    'getting the shape down…',
    'rough sketch coming together…',
  ],
  50: [
    'halfway — adding the good stuff…',
    'filling in the middle now…',
    'starting to look like something…',
  ],
  75: [
    'almost there — just details left…',
    'polishing the highlights…',
    'one more pass and it\'s done…',
  ],
};

function pickLine(pool: string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length] ?? pool[0]!;
}

export function easelMilestoneLine(topic: string, pct: number, drawingId: string): string | null {
  const pool = MILESTONE_LINES[pct];
  if (!pool) return null;
  const line = pickLine(pool, `${drawingId}:${pct}`);
  return `${line} (${topic})`;
}

export const EASEL_MILESTONE_PCTS = [25, 50, 75] as const;
