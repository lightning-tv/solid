# Integrating with Solid Devtools

[Solid Devtools](https://github.com/thetarnav/solid-devtools) provides debugging capabilities for Solid.js applications. This guide explains how to integrate solid-devtools with Lightning Solid to inspect your Lightning applications.

## Installation

For chrome-development install the [Solid Devtools Chrome Extension](https://chrome.google.com/webstore/detail/solid-devtools/kmcfjchnmmaeeagadbhoofajiopoceel).

Then, install the `solid-devtools` package:

```bash
pnpm add -D solid-devtools
```

## Configuration

### 1. Setup Vite Plugin (Optional)

Add the Solid Devtools Vite plugin to your Vite configuration file:

```ts
import devtools from 'solid-devtools/vite';
import solidPlugin from 'vite-plugin-solid';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    devtools({
      /* features options - all disabled by default */
      autoname: true,
      locator: {
        jsxLocation: true,
        componentLocation: true,
        targetIDE: 'vscode',
      },
    }),
    solidPlugin({
      solid: {
        moduleName: '@lightningtv/solid',
        generate: 'universal',
      },
    }),
  ],
});
```

### 2. Configure Element Interface

Since Lightning.js uses a custom renderer (not DOM-based), you need to provide Solid Devtools with a custom ElementInterface implementation. Fortunately, `@lightningtv/solid` already includes this implementation.

Add the following code to your application entry file (typically `index.tsx`):

```ts
import 'solid-devtools';
import { setElementInterface } from 'solid-devtools/setup';
import { elementInterface } from '@lightningtv/solid/devtools';

setElementInterface(elementInterface);
```

This allows the Solid Devtools panel to properly display and interact with your Lightning application's component tree.

For more information on supporting custom renderers in Solid Devtools, refer to the [official documentation](https://github.com/thetarnav/solid-devtools/tree/main/packages/debugger#supporting-custom-renderers).
