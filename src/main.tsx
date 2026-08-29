import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const rootElement = document.getElementById('root')!;

/**
 * Boot with a real error screen for configuration failures.
 *
 * config.ts throws when VITE_API_BASE_URL is missing (fail-loud by design).
 * In dev, Vite's overlay shows it; in a PRODUCTION build there is no overlay
 * — without this boundary the user gets a blank white page and a console
 * error nobody reads. A misconfigured deploy must say so on screen.
 */
async function boot() {
  try {
    // Dynamic import so the config throw happens inside the try, after the
    // module graph loads — a static import would throw before we can catch.
    const { default: App } = await import('./App');
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    rootElement.innerHTML = `
      <div style="min-height:100dvh;display:grid;place-items:center;background:#0b0d10;color:#e8ecf2;font-family:system-ui,sans-serif;padding:24px">
        <div style="max-width:560px;border:1px solid #3a2b2b;background:#161011;border-radius:12px;padding:24px">
          <p style="font-family:ui-monospace,monospace;color:#f26d6d;font-size:12px;letter-spacing:.08em;margin:0 0 8px">CONFIGURATION ERROR</p>
          <p style="margin:0;line-height:1.6;font-size:15px"></p>
        </div>
      </div>`;
    // textContent, not innerHTML, for the message — it may echo env values.
    rootElement.querySelector('div > div > p + p')!.textContent = message;
    console.error(error);
  }
}

void boot();
