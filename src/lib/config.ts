/**
 * Runtime configuration.
 *
 * The API base URL MUST come from the environment. If it is missing we throw
 * at startup — loudly, before any screen renders (main.tsx catches it and
 * paints a readable configuration-error screen in production builds).
 *
 * Why so strict: the system this starter was extracted from shipped a silent
 * fallback to a hardcoded production URL. Every fresh clone "worked" by
 * quietly talking to someone else's production backend, which hid
 * misconfiguration for weeks and risked polluting real data. A fresh clone
 * must fail with an actionable message instead.
 */

/** Pure resolver — exported so the fail-loud contract is pinned by a test. */
export function resolveApiBaseUrl(raw: string | undefined): string {
  if (!raw || !raw.trim()) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Copy .env.example to .env and point it at ' +
        'your backend (e.g. http://localhost:8000). This app deliberately has no ' +
        'default URL — a silent fallback once sent fresh clones to a production backend.',
    );
  }
  return raw.trim().replace(/\/+$/, '');
}

/** Backend base URL, without a trailing slash. */
export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL as string | undefined,
);
