import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      // Measure every source file, not only the ones a test happens to import.
      // Without `include`, v8 reports ~77% over the handful of touched files
      // while the real figure across the app is far lower.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
      reporter: ['text', 'json-summary'],
      thresholds: {
        // AGENTS.md asks for 85% lines / 80% branches / 90% functions. The repo
        // is nowhere near that: the React page and component layer has almost no
        // tests, which is the real remaining work. A gate pinned at 85 would fail
        // every build and be switched off within a week.
        //
        // So this is a ratchet, set just under today's measured number. It cannot
        // be satisfied by deleting tests, and adding an untested source file
        // lowers the percentage and fails — which is the pressure we want. Raise
        // these as coverage grows; never lower them.
        lines: 28,
        statements: 27,
        functions: 20,
        branches: 29,

        // The trust boundary is held to the AGENTS.md bar instead of the ratchet.
        // Anything touching attacker-controlled input or the session check may
        // not regress at all.
        'src/lib/security/**': { lines: 88, statements: 88, functions: 100, branches: 80 },
        'src/contexts/**': { lines: 95, statements: 95, functions: 85, branches: 75 },
      },
    },
  },
})
