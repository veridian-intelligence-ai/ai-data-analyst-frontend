import type { DetailTableVisual } from './types';
import { formatValue } from './format';

interface Props {
  visual: DetailTableVisual;
}

/**
 * Detail table. Columns come entirely from the contract — key, label, and
 * per-column `value_format`. The component never guesses semantics from the
 * column name (that regex-sniffing anti-pattern shipped wrong currency
 * symbols in production — see visuals/format.ts).
 */
export function DetailTable({ visual }: Props) {
  const shownRows = visual.data.length;
  const totalRows = visual.row_count ?? shownRows;

  return (
    <div className="detail-table-wrap">
      <table className="detail-table">
        <thead>
          <tr>
            {visual.columns.map((col) => (
              <th key={col.key} className={col.value_format ? 'cell-numeric' : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visual.data.map((row, i) => (
            <tr key={i}>
              {visual.columns.map((col) => (
                <td key={col.key} className={col.value_format ? 'cell-numeric' : undefined}>
                  {formatValue(row[col.key], col.value_format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalRows > shownRows && (
        <p className="detail-table-note">
          Showing {shownRows} of {totalRows} rows
        </p>
      )}
    </div>
  );
}
