import { normalizeDisplayName } from './normalize';
import type { ModerationBlock } from './types';

export type BlockCheckInput = {
  userId?: string | null;
  displayName?: string | null;
  ip?: string | null;
};

export function isBlockedByList(
  blocks: Pick<ModerationBlock, 'kind' | 'value'>[],
  input: BlockCheckInput,
): boolean {
  const userId = input.userId?.trim().toLowerCase();
  const displayName = input.displayName ? normalizeDisplayName(input.displayName) : null;
  const ip = input.ip?.trim();

  for (const block of blocks) {
    if (block.kind === 'user_id' && userId && block.value.toLowerCase() === userId) return true;
    if (block.kind === 'display_name' && displayName && block.value === displayName) return true;
    if (block.kind === 'ip' && ip && block.value === ip) return true;
  }
  return false;
}
