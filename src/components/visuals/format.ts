/**
 * Number formatting for visuals (KPI cards, chart axes/tooltips, tables).
 *
 * IMPORTANT LESSON — formatting is driven by `value_format` FROM THE
 * CONTRACT, never by column-name sniffing. An earlier implementation guessed
 * formats with regexes over column names ("revenue|amount|price" → currency)
 * and shipped wrong currency symbols to production the first time a column
 * was named something the regex didn't expect — and put currency symbols on
 * columns that merely mentioned money. The backend knows the semantics of
 * each value; it declares them in `value_format`, and this module only obeys.
 */
import type { ValueFormat } from './types';

/**
 * Format a single value according to the contract's `value_format`.
 *
 * - currency: EUR with the € symbol (the starter's example org trades in EUR)
 * - percent:  1 decimal place + '%'. The backend already normalizes ratios
 *             to the 0–100 scale, so the value is rendered as received.
 * - integer:  grouped, no decimals
 * - decimal:  grouped, exactly 2 decimals
 * - absent:   grouped; whole numbers get no decimals, fractions get EXACTLY 2
 *             (6.6 renders "6.60" — one-decimal stragglers in a column of
 *             two-decimal values read as typos)
 *
 * Null, undefined and empty-string render an em dash "—": a visibly empty
 * marker reads as "deliberately no value", where a blank cell reads as a
 * rendering bug. Other strings (values the backend pre-formatted) and
 * non-finite numbers pass through untouched.
 */
export function formatValue(
  value: number | string | null | undefined,
  format?: ValueFormat | null,
  locale: string = 'en-US',
): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value);

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }).format(value);
    case 'percent':
      return (
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value) + '%'
      );
    case 'integer':
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
    case 'decimal':
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    default:
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
      }).format(value);
  }
}

/** Compact notation for axis ticks (1.2K, 3.4M) — labels stay readable. */
export function formatAxisTick(value: unknown, locale: string = 'en-US'): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value ?? '');
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}
