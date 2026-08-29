import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimpleChartVisual } from './types';
import { formatAxisTick, formatValue } from './format';
import {
  AXIS_LINE,
  AXIS_TICK,
  CHART_HEIGHT,
  GRID_STROKE,
  SERIES_COLORS,
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_LABEL_STYLE,
  truncateLabel,
  xAxisLayout,
} from './chartTheme';

interface Props {
  visual: SimpleChartVisual;
}

export function BarChart({ visual }: Props) {
  const labels = visual.data.map((d) => String(d[visual.x_field] ?? ''));
  const layout = xAxisLayout(labels);
  const seriesName = visual.y_label || visual.y_field;

  return (
    <div className="chart-container" style={{ height: CHART_HEIGHT }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={visual.data}
          margin={{ top: 8, right: 8, left: 0, bottom: layout.angle !== 0 ? 24 : 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey={visual.x_field}
            tick={{ ...AXIS_TICK }}
            tickLine={false}
            axisLine={{ ...AXIS_LINE }}
            angle={layout.angle}
            textAnchor={layout.textAnchor}
            height={layout.height}
            interval={layout.interval}
            tickFormatter={(v) => truncateLabel(String(v))}
          />
          <YAxis
            tick={{ ...AXIS_TICK }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => formatAxisTick(v)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(79, 140, 255, 0.08)' }}
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(value) => [
              // value_format comes from the contract — see format.ts.
              formatValue(value as number | string, visual.value_format),
              seriesName,
            ]}
          />
          <Bar
            dataKey={visual.y_field}
            fill={SERIES_COLORS[0]}
            radius={[5, 5, 0, 0]}
            maxBarSize={44}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
