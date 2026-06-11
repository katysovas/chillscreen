/** Horizontal step-aside while in 1:1 connected chat. */
export const CHAT_CONNECT_SPREAD_PX = 20;

/** Crowd character — nudge away from screen centre. */
export function chatConnectSpreadPx(screenPct: number): number {
  if (screenPct < 50) return -CHAT_CONNECT_SPREAD_PX;
  if (screenPct > 50) return CHAT_CONNECT_SPREAD_PX;
  return 0;
}

/** Local player at centre — nudge away from partner. */
export function chatConnectSpreadPlayerPx(partnerScreenPct: number): number {
  if (partnerScreenPct < 50) return CHAT_CONNECT_SPREAD_PX;
  if (partnerScreenPct > 50) return -CHAT_CONNECT_SPREAD_PX;
  return 0;
}
