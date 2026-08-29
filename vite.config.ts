/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    // `globals: true` lets @testing-library/react register its automatic
    // afterEach cleanup; tests still import describe/it/expect explicitly.
    globals: true,
    // Tests never hit the network, but src/lib/config.ts throws when the
    // API base URL is missing (fail-loudly rule), so give it a dummy value.
    env: {
      VITE_API_BASE_URL: 'http://localhost:8000',
    },
  },
});
