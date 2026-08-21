import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 80,
        'src/domain/**': { lines: 95, branches: 90 },
      },
      exclude: ['src/cli/index.ts'],
    },
  },
})
