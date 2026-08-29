import type { ReactElement } from 'react';
import type { AnalystVisual } from './types';
import { KpiCards } from './KpiCards';
import { BarChart } from './BarChart';
import { LineChartBlock } from './LineChartBlock';
import { GroupedBarChart } from './GroupedBarChart';
import { DetailTable } from './DetailTable';

interface Props {
  visual?: AnalystVisual | null;
}

/**
 * Renders a visual payload, or nothing.
 *
 * The payload originates from LLM output routed through the backend's
 * visual_builder — treat it as UNTRUSTED INPUT. Every branch validates the
 * shape it needs before rendering and silently renders nothing when the
 * payload is malformed: a missing chart is a degraded answer, a crashed chat
 * screen is an outage.
 */
export function VisualRenderer({ visual }: Props) {
  if (!visual || typeof visual !== 'object' || !('visual_type' in visual)) return null;

  let body: ReactElement | null = null;

  if (visual.visual_type === 'kpi_cards') {
    if (!Array.isArray(visual.cards) || visual.cards.length === 0) return null;
    body = <KpiCards visual={visual} />;
  } else if (visual.visual_type === 'chart') {
    if (!visual.x_field || !Array.isArray(visual.data) || visual.data.length === 0) {
      return null;
    }
    if (visual.chart_type === 'grouped_bar') {
      if (!Array.isArray(visual.series) || visual.series.length === 0) return null;
      body = <GroupedBarChart visual={visual} />;
    } else if (visual.chart_type === 'bar' || visual.chart_type === 'line') {
      if (!visual.y_field) return null;
      body =
        visual.chart_type === 'bar' ? <BarChart visual={visual} /> : <LineChartBlock visual={visual} />;
    } else {
      return null;
    }
  } else if (visual.visual_type === 'detail_table') {
    if (
      !Array.isArray(visual.columns) ||
      visual.columns.length === 0 ||
      !Array.isArray(visual.data) ||
      visual.data.length === 0
    ) {
      return null;
    }
    body = <DetailTable visual={visual} />;
  } else {
    // Unknown visual_type from a newer backend — degrade to prose-only.
    return null;
  }

  // KPI cards are already card-shaped; everything else gets the panel chrome.
  const isKpi = visual.visual_type === 'kpi_cards';

  return (
    <div className="visual-block">
      {visual.title && !isKpi && <p className="visual-title">{visual.title}</p>}
      {isKpi ? body : <div className="visual-panel">{body}</div>}
    </div>
  );
}
