import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'scripts/**',
      '*.config.js',
      '*.config.ts',
      'next-env.d.ts',
      '.yarn/**',
      'supabase/.temp/**',
      // Playwright's reporter writes bundled viewer assets; they are generated
      // build output, not source, and linting them reports hundreds of errors.
      'playwright-report/**',
      'test-results/**',
      'lighthouse-report/**',
      '.lighthouseci/**',
      // Repository-local scratch space (AGENTS.md §12), never linted.
      '.work/**',
      '.artifacts/**',
      '.cache/**',
      '.agent/**',
      '.agents/**',
      '.claude/**',
      '.codex/**',
      '.continue/**',
      '.cursor/**',
      '.gemini/**',
      '.omp/**',
      '.opencode/**',
      '.pi/**',
      '.roo/**',
      '.windsurf/**',
      'tools/oxlint/anti-slop/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Next.js rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Custom overrides
      '@next/next/no-page-custom-font': 'off', // We use App Router with fonts in layout.tsx
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  ...tseslint.configs.recommended
)
