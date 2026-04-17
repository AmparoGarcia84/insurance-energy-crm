import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo'

  return {
    plugins: [react()],

    // GitHub Pages serves the app at /insurance-energy-crm/ — set the base
    // path so all asset URLs are generated with the correct prefix.
    base: isDemo ? '/insurance-energy-crm/' : '/',

    // Inject build-time constants for demo mode so the app works without
    // .env files (gitignored by the .env.* rule in .gitignore).
    define: {
      'import.meta.env.VITE_DEMO_MODE': JSON.stringify(isDemo ? 'true' : 'false'),
      // auth.ts / users.ts / TopBar / UserManagement / MyAccount declare
      // `const API_URL = import.meta.env.VITE_API_URL` with no fallback —
      // without this they would produce `undefined/auth/me` in CI.
      ...(isDemo && { 'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000') }),
    },

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
