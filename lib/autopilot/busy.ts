import { activeChatDrawingForNpc } from '@/lib/easel/chatNpcDrawings';
import type { ChatNpcDrawingSession, EaselSessionSync } from '@/lib/easel/types';

export type AutopilotEventId =
  | 'rps'
  | 'npc-chat'
  | 'human-approach'
  | 'easel'
  | 'draw'
  | 'vendor'
  | 'prop-loss';

let activeEvent: AutopilotEventId | null = null;

export function isAutopilotEventBusy(): boolean {
  return activeEvent != null;
}

export function getAutopilotActiveEvent(): AutopilotEventId | null {
  return activeEvent;
}

export function tryBeginAutopilotEvent(id: AutopilotEventId): boolean {
  if (activeEvent) return false;
  activeEvent = id;
  return true;
}

export function endAutopilotEvent(id: AutopilotEventId): void {
  if (activeEvent === id) activeEvent = null;
}

export function clearAutopilotEvent(): void {
  activeEvent = null;
}

export function isOwnerFestieOccupied(
  ownerId: string,
  activeEaselSession: EaselSessionSync | null | undefined,
  chatNpcDrawings: ChatNpcDrawingSession[],
): boolean {
  const chatDraw = activeChatDrawingForNpc(chatNpcDrawings, ownerId);
  if (chatDraw?.status === 'painting') return true;
  return activeEaselSession?.slots.some(
    s => s.npc === ownerId && s.status === 'painting',
  ) ?? false;
}

export function canRunAutopilotActivity(
  ownerId: string,
  activeEaselSession: EaselSessionSync | null | undefined,
  chatNpcDrawings: ChatNpcDrawingSession[],
): boolean {
  if (isAutopilotEventBusy()) return false;
  if (isOwnerFestieOccupied(ownerId, activeEaselSession, chatNpcDrawings)) return false;
  return true;
}
