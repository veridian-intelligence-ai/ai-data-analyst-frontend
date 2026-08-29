import type { KpiCardsVisual } from './types';
import { formatValue } from './format';

interface Props {
  visual: KpiCardsVisual;
}

/** Row of KPI stat cards. The kpi_cards payload carries plain numbers. */
export function KpiCards({ visual }: Props) {
  return (
    <div className="kpi-grid">
      {visual.cards.map((card, i) => (
        <div className="kpi-card" key={`${card.label}-${i}`}>
          <div className="kpi-card-label">{card.label}</div>
          <div className="kpi-card-value">{formatValue(card.value)}</div>
        </div>
      ))}
    </div>
  );
}
