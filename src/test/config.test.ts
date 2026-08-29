import { describe, it, expect } from 'vitest';
import { resolveApiBaseUrl } from '../lib/config';

/**
 * Pins the starter's flagship inversion: a missing API URL FAILS LOUDLY.
 * The system this starter derives from silently fell back to a hardcoded
 * production URL — this test is the contract that no fallback ever returns.
 */
describe('resolveApiBaseUrl', () => {
  it('throws an actionable error when the variable is missing', () => {
    expect(() => resolveApiBaseUrl(undefined)).toThrow(/VITE_API_BASE_URL is not set/);
    expect(() => resolveApiBaseUrl('')).toThrow(/VITE_API_BASE_URL/);
    expect(() => resolveApiBaseUrl('   ')).toThrow(/VITE_API_BASE_URL/);
  });

  it('never returns a fallback URL', () => {
    // If someone "helpfully" adds a default return value, this fails in CI:
    // the function must THROW, not resolve, when the variable is absent.
    let resolved: string | undefined;
    try {
      resolved = resolveApiBaseUrl(undefined);
    } catch {
      // expected path
    }
    expect(resolved).toBeUndefined();
  });

  it('normalizes trailing slashes', () => {
    expect(resolveApiBaseUrl('http://localhost:8000/')).toBe('http://localhost:8000');
    expect(resolveApiBaseUrl('https://api.acme.example///')).toBe('https://api.acme.example');
  });
});
