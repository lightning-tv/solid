import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(({ mode }) => ({
  define: {
    __DEV__: false,
    LIGHTNING_DOM_RENDERING: true,
    'import.meta.env.VITE_LIGHTNING_DOM_RENDERING': '"true"',
  },
  plugins: [
    solidPlugin({
      hot: false,
      solid: {
        moduleName: '@lightningtv/solid',
        generate: 'universal',
        builtIns: [],
      },
    }),
  ],
  test: {
    watch: false,
    isolate: false,
    passWithNoTests: true,
    environment: 'jsdom',
  },
  resolve: {
    conditions: ['@lightningtv/source', 'browser', 'development'],
  },
}));
