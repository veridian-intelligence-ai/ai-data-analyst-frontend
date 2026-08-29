/**
 * Visual payload contract — the seam between the backend's visual_builder and
 * this UI. Keep in sync with starter/backend/app/ai/visual_builder.py.
 *
 * Everything the UI needs to render a visual travels IN the payload,
 * including `value_format`. The frontend must never infer semantics from
 * column names (see format.ts for the production incident behind that rule).
 */

export type ValueFormat = 'currency' | 'percent' | 'integer' | 'decimal';

// ── KPI cards ───────────────────────────────────────────────────────────────

export interface KpiCard {
  label: string;
  value: number;
}

export interface KpiCardsVisual {
  visual_type: 'kpi_cards';
  title?: string | null;
  cards: KpiCard[];
}

// ── Charts ──────────────────────────────────────────────────────────────────

/** One row of chart data: the x value plus one or more numeric fields. */
export type ChartDatum = Record<string, string | number | null | undefined>;

export interface SimpleChartVisual {
  visual_type: 'chart';
  chart_type: 'bar' | 'line';
  title?: string | null;
  x_field: string;
  y_field: string;
  x_label?: string | null;
  y_label?: string | null;
  value_format?: ValueFormat | null;
  data: ChartDatum[];
}

/**
 * Grouped bar: `series` lists the per-group field names present in each data
 * row (e.g. data: [{ month: 'Jan', North: 12, South: 9 }], series: ['North', 'South']).
 */
export interface GroupedBarChartVisual {
  visual_type: 'chart';
  chart_type: 'grouped_bar';
  title?: string | null;
  x_field: string;
  series: string[];
  x_label?: string | null;
  y_label?: string | null;
  value_format?: ValueFormat | null;
  data: ChartDatum[];
}

export type ChartVisual = SimpleChartVisual | GroupedBarChartVisual;

// ── Detail table ────────────────────────────────────────────────────────────

export interface DetailTableColumn {
  key: string;
  label: string;
  /** Per-column formatting, from the contract — never inferred client-side. */
  value_format?: ValueFormat | null;
}

export interface DetailTableVisual {
  visual_type: 'detail_table';
  title?: string | null;
  columns: DetailTableColumn[];
  data: Array<Record<string, string | number | null | undefined>>;
  row_count?: number;
}

// ── Union ───────────────────────────────────────────────────────────────────

export type AnalystVisual = KpiCardsVisual | ChartVisual | DetailTableVisual;
