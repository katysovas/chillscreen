import type { CSSProperties } from 'react';

export type StageChartTheme = 'page' | 'modal';

/** Layout-only — safe on LP (colors come from CSS classes). */
export const STAGE_CHART_ROW_LAYOUT: CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: 0,
  margin: 0,
  borderRadius: 10,
  textAlign: 'left',
  cursor: 'pointer',
  font: 'inherit',
};

export const STAGE_CHART_ROW_INNER: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
};

export const STAGE_CHART_THUMB_LAYOUT: CSSProperties = {
  flex: '0 0 52px',
  width: 52,
  height: 52,
  minWidth: 52,
  maxWidth: 52,
  flexShrink: 0,
  borderRadius: 8,
  overflow: 'hidden',
};

export const STAGE_CHART_THUMB_IMG: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

export const STAGE_CHART_INFO_LAYOUT: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  overflow: 'hidden',
};

export const STAGE_CHART_RANK_LAYOUT: CSSProperties = {
  flex: '0 0 36px',
  width: 36,
  minWidth: 36,
  flexShrink: 0,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1,
};

export const STAGE_CHART_MOVE_LAYOUT: CSSProperties = {
  flex: '0 0 28px',
  width: 28,
  minWidth: 28,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/** Modal palette — inline for Safari when CSS chunks load late. */
export const STAGE_CHART_MODAL: CSSProperties = {
  color: '#fff',
  fontFamily: "Georgia, 'Times New Roman', serif",
};

export const STAGE_CHART_TABBAR: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  marginBottom: -1,
  maxWidth: '100%',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

export function stageChartSwitchTabStyle(active: boolean): CSSProperties {
  return {
    padding: '10px 14px 9px',
    margin: 0,
    border: 'none',
    borderBottom: `2px solid ${active ? '#ffb347' : 'transparent'}`,
    background: 'transparent',
    color: active ? '#fff' : 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    flexShrink: 0,
    WebkitAppearance: 'none',
    appearance: 'none',
  };
}

export const STAGE_CHART_SWITCH_HEADER: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
  marginBottom: 12,
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
};

export const STAGE_CHART_BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  maxHeight: 'min(52vh, 420px)',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  minHeight: 0,
};

const MODAL_ROW: CSSProperties = {
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.04)',
};

const MODAL_ROW_SELECTED: CSSProperties = {
  border: '1px solid rgba(230, 126, 34, 0.55)',
  background: 'rgba(230, 126, 34, 0.12)',
  boxShadow: 'inset 0 0 0 1px rgba(230, 126, 34, 0.15)',
};

const MODAL_ROW_CURRENT: CSSProperties = {
  border: '1px solid rgba(255, 255, 255, 0.16)',
};

const MODAL_THUMB: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.28)',
};

const MODAL_NAME: CSSProperties = {
  margin: 0,
  fontWeight: 700,
  fontSize: 14,
  lineHeight: 1.25,
  color: '#fff',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const MODAL_SUBTITLE: CSSProperties = {
  margin: '3px 0 0',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  lineHeight: 1.35,
  color: 'rgba(255, 255, 255, 0.5)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const MODAL_JOIN: CSSProperties = {
  flex: '0 0 auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '7px 12px',
  borderRadius: 999,
  border: '1px solid rgba(230, 126, 34, 0.45)',
  background: 'rgba(230, 126, 34, 0.14)',
  color: '#ffb347',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  flexShrink: 0,
  WebkitAppearance: 'none',
  appearance: 'none',
};

export const STAGE_CHART_JOIN_DISABLED: CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
};

const MODAL_MOVE_SAME: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.22)',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  lineHeight: 1,
};

const MODAL_MOVE_UP: CSSProperties = { color: '#6eed9a' };
const MODAL_MOVE_DOWN: CSSProperties = { color: '#ff6b6b' };

export function stageChartRowStyle(
  theme: StageChartTheme,
  opts?: { selected?: boolean; current?: boolean },
): CSSProperties {
  if (theme === 'page') return STAGE_CHART_ROW_LAYOUT;
  return {
    ...STAGE_CHART_ROW_LAYOUT,
    ...MODAL_ROW,
    ...(opts?.selected ? MODAL_ROW_SELECTED : opts?.current ? MODAL_ROW_CURRENT : {}),
  };
}

export function stageChartThumbStyle(theme: StageChartTheme): CSSProperties {
  return theme === 'modal'
    ? { ...STAGE_CHART_THUMB_LAYOUT, ...MODAL_THUMB }
    : STAGE_CHART_THUMB_LAYOUT;
}

export function stageChartRankStyle(theme: StageChartTheme, rank: number): CSSProperties {
  const layout = {
    ...STAGE_CHART_RANK_LAYOUT,
    fontSize: rank <= 3 ? 17 : 15,
  };
  if (theme === 'page') return layout;
  return {
    ...layout,
    color: rank <= 3 ? '#ffb347' : '#fff',
  };
}

export function stageChartNameStyle(theme: StageChartTheme): CSSProperties | undefined {
  return theme === 'modal' ? MODAL_NAME : undefined;
}

export function stageChartSubtitleStyle(theme: StageChartTheme): CSSProperties | undefined {
  return theme === 'modal' ? MODAL_SUBTITLE : undefined;
}

export function stageChartJoinStyle(theme: StageChartTheme): CSSProperties | undefined {
  return theme === 'modal' ? MODAL_JOIN : undefined;
}

export function stageChartMoveStyle(
  theme: StageChartTheme,
  move: 'up' | 'down' | 'same',
): CSSProperties | undefined {
  if (theme === 'page') return undefined;
  if (move === 'up') return MODAL_MOVE_UP;
  if (move === 'down') return MODAL_MOVE_DOWN;
  return MODAL_MOVE_SAME;
}
