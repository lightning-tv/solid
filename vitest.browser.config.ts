import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import solid from 'vite-plugin-solid';

export default defineConfig(({ mode }) => ({
  define: {
    __DEV__: true,
    VITE_LIGHTNING_DOM_RENDERING: true,
  },
  plugins: [
    solid({
      hot: false,
      solid: {
        moduleName: '@lightningtv/solid',
        generate: 'universal',
        builtIns: [],
      },
    }),
  ],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      // https://vitest.dev/guide/browser/playwright
      instances: [
        {
          browser: 'chromium',
          headless: false,
        },
      ],
    },
  },
  resolve: {
    conditions: ['@lightningtv/source', 'browser', 'development'],
  },
}));
