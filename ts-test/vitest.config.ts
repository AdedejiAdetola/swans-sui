import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120000,
    hookTimeout: 120000,
    teardownTimeout: 60000,
    setupFiles: ['src/config/test-setup.ts'],
    sequence: {
      hooks: 'stack',
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});