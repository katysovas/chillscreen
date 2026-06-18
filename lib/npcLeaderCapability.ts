/** Device capability reported on join — server picks the NPC sim leader. */

export type NpcLeaderCapability = {
  /** `navigator.hardwareConcurrency`, clamped 1–32. */
  cores: number;
  mobile: boolean;
  /** One-shot rAF sample (frames/sec), when available. */
  fps?: number;
};

export const DEFAULT_NPC_LEADER_CAPABILITY: NpcLeaderCapability = {
  cores: 2,
  mobile: true,
};

export function normalizeNpcLeaderCapability(
  raw?: Partial<NpcLeaderCapability> | null,
): NpcLeaderCapability {
  if (!raw) return DEFAULT_NPC_LEADER_CAPABILITY;
  const cores = raw.cores != null && Number.isFinite(raw.cores)
    ? Math.max(1, Math.min(32, Math.round(raw.cores)))
    : DEFAULT_NPC_LEADER_CAPABILITY.cores;
  const mobile = raw.mobile ?? DEFAULT_NPC_LEADER_CAPABILITY.mobile;
  const fps = raw.fps != null && Number.isFinite(raw.fps)
    ? Math.max(0, Math.min(120, Math.round(raw.fps)))
    : undefined;
  return fps != null ? { cores, mobile, fps } : { cores, mobile };
}

/** Higher score → preferred NPC sim leader. */
export function scoreNpcLeaderCapability(cap: NpcLeaderCapability): number {
  let score = cap.cores * 10;
  if (!cap.mobile) score += 50;
  if (cap.fps != null) score += cap.fps;
  else if (!cap.mobile) score += 30;
  else score += 15;
  return score;
}

/** Pick the strongest device; prefer the incumbent on ties to avoid churn. */
export function pickNpcLeaderId(
  candidates: readonly string[],
  capabilities: ReadonlyMap<string, NpcLeaderCapability>,
  currentLeaderId: string | null = null,
): string | null {
  if (candidates.length === 0) return null;
  const ranked = [...candidates]
    .map(id => ({
      id,
      score: scoreNpcLeaderCapability(
        capabilities.get(id) ?? DEFAULT_NPC_LEADER_CAPABILITY,
      ),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.id === currentLeaderId) return -1;
      if (b.id === currentLeaderId) return 1;
      return a.id.localeCompare(b.id);
    });
  return ranked[0]!.id;
}
