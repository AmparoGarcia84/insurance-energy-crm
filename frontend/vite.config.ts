import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv reads the .env file for the current mode (e.g. .env.demo when
  // --mode demo is passed). The third argument '' means "load all vars",
  // including those without the VITE_ prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [react()],
  // VITE_BASE is set to '/insurance-energy-crm/' in .env.demo for GitHub Pages.
  base: env.VITE_BASE ?? '/',
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
  }
})
