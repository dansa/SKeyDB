import path from 'path'

import {configDefaults, defineConfig} from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx,mts,mjs,js,jsx}'],
    setupFiles: './src/test/setup.ts',
    exclude: [...configDefaults.exclude, '.worktrees/**'],
  },
})
