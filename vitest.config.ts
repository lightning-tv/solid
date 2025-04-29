import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
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
});
