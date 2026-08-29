import { describe, expect, it } from 'vitest';
import { formatAxisTick, formatValue } from '../components/visuals/format';

describe('formatValue — contract-driven formatting', () => {
  it('formats currency as EUR with the € symbol', () => {
    expect(formatValue(1234.5, 'currency')).toBe('€1,234.50');
    expect(formatValue(0, 'currency')).toBe('€0.00');
  });

  it('formats percent with exactly 1 decimal place', () => {
    expect(formatValue(42, 'percent')).toBe('42.0%');
    expect(formatValue(7.25, 'percent')).toBe('7.3%');
    expect(formatValue(0.5, 'percent')).toBe('0.5%');
  });

  it('formats integer with grouping and no decimals', () => {
    expect(formatValue(10834, 'integer')).toBe('10,834');
    expect(formatValue(10834.6, 'integer')).toBe('10,835');
  });

  it('formats decimal with exactly 2 decimal places', () => {
    expect(formatValue(6.6, 'decimal')).toBe('6.60');
    expect(formatValue(1234, 'decimal')).toBe('1,234.00');
  });

  it('without a format: whole numbers bare, fractions padded to exactly 2 decimals', () => {
    expect(formatValue(10834)).toBe('10,834');
    expect(formatValue(6.635)).toBe('6.64');
    // Padding matters: a "6.6" straggler in a column of "x.xx" values reads
    // as a typo — one decimal place pads up to two.
    expect(formatValue(6.6)).toBe('6.60');
  });

  it('passes through strings and non-finite numbers untouched', () => {
    expect(formatValue('already formatted', 'currency')).toBe('already formatted');
    expect(formatValue(Number.NaN, 'integer')).toBe('NaN');
    expect(formatValue(Infinity, 'decimal')).toBe('Infinity');
  });

  it('renders an em dash for null/undefined/empty cells', () => {
    // A visibly empty marker reads as "deliberately no value"; a blank
    // cell reads as a rendering bug.
    expect(formatValue(null, 'currency')).toBe('—');
    expect(formatValue(undefined)).toBe('—');
    expect(formatValue('')).toBe('—');
  });

  it('respects an explicit locale', () => {
    // German locale: dot for thousands, comma for decimals, symbol after.
    expect(formatValue(1234.5, 'decimal', 'de-DE')).toBe('1.234,50');
  });
});

describe('formatAxisTick', () => {
  it('uses compact notation for large numbers', () => {
    expect(formatAxisTick(1200)).toBe('1.2K');
    expect(formatAxisTick(3400000)).toBe('3.4M');
  });

  it('passes through non-numbers', () => {
    expect(formatAxisTick('Q1')).toBe('Q1');
  });
});
