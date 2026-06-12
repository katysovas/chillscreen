/** Stable world-x anchor for an NPC pair overlay (survives missing movement refs). */

const anchors = new Map<string, { wxA: number; wxB: number }>();

export function setNpcConvoAnchor(convoId: string, wxA: number, wxB: number): void {
  anchors.set(convoId, { wxA, wxB });
}

export function getNpcConvoAnchor(convoId: string): { wxA: number; wxB: number } | undefined {
  return anchors.get(convoId);
}

export function clearNpcConvoAnchor(convoId: string): void {
  anchors.delete(convoId);
}
