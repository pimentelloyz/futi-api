import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['src/tests/setup.ts'],
    include: ['src/**/*.test.ts'],
    globals: true,
    sequence: {
      concurrent: false,
    },
  },
});
