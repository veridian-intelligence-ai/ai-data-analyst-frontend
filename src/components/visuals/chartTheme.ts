/**
 * Shared recharts styling for the dark theme (kept as plain constants —
 * recharts needs concrete values, not CSS classes).
 */

/** Series palette: first entry is the app accent; the rest keep contrast on dark. */
export const SERIES_COLORS = ['#4f8cff', '#8f6fff', '#3ecf8e', '#ffb86b', '#ff7597', '#57d3e0'];

export const GRID_STROKE = 'rgba(232, 236, 242, 0.08)';
export const AXIS_TICK = { fontSize: 11, fill: 'rgba(232, 236, 242, 0.55)' } as const;
export const AXIS_LINE = { stroke: 'rgba(232, 236, 242, 0.15)' } as const;

export const TOOLTIP_CONTENT_STYLE = {
  background: '#14171c',
  border: '1px solid rgba(232, 236, 242, 0.12)',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#e8ecf2',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
} as const;

export const TOOLTIP_LABEL_STYLE = { color: '#e8ecf2', fontWeight: 600 } as const;

export const CHART_HEIGHT = 260;

export const truncateLabel = (s: string, max = 14): string =>
  s.length > max ? s.slice(0, max - 1) + '…' : s;

/**
 * Long or numerous category labels: rotate them; past a point, also skip
 * every Nth tick so they stay legible instead of overlapping.
 */
export function xAxisLayout(labels: string[]): {
  angle: number;
  textAnchor: 'end' | 'middle';
  height: number;
  interval: number | 'preserveStartEnd';
} {
  const longest = labels.reduce((max, l) => Math.max(max, l.length), 0);
  const rotate = longest > 8 || labels.length > 6;
  // Auto-skip: with many points, label roughly every Nth tick.
  const interval = labels.length > 16 ? Math.ceil(labels.length / 12) : 0;
  return {
    angle: rotate ? -30 : 0,
    textAnchor: rotate ? 'end' : 'middle',
    height: rotate ? 56 : 26,
    interval,
  };
}
