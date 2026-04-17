import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // VITE_BASE is set to '/insurance-energy-crm/' for the GitHub Pages demo build.
  // In normal dev/production it defaults to '/' (no env var needed).
  base: process.env.VITE_BASE ?? '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/i18n/**', 'src/test/**', 'src/vite-env.d.ts'],
    },
  },
})
