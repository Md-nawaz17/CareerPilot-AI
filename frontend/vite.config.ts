import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const base = process.env.GITHUB_PAGES ? '/CareerPilot-AI/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
