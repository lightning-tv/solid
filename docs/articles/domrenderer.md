# DOM Renderer

Lightning JS relies on WebGL or Canvas to deliver high-performance rendering across a wide range of devices. However, for certain devices where HTML rendering might be better suited or more performant, such as the PlayStation 5, or environments with specific WebGL constraints, we offer a standalone **DOM Renderer**.

When enabled, the DOM Renderer outputs standard HTML DOM elements instead of drawing to a canvas. This can offer advantages for particular target platforms that are highly optimized for HTML/CSS rendering.

## Enabling the DOM Renderer

Switching to the DOM Renderer is a two-step process:

### 1. Vite Configuration (Bundling)

First, you need to use a Vite flag to bundle the DOM Renderer code into your application. You do this by defining the global variable in your `vite.config.ts` so that it gets compiled correctly.

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    LIGHTNING_DOM_RENDERING: true,
  },
  // ... other config options
});
```

### 2. Runtime Configuration (Activation)

Once the bundle is configured, you must turn on the DOM Renderer in your application's `Config` settings. This allows you to toggle it on and off dynamically within the application code.

```ts
import { Config } from '@lightningjs/solid';

Config.domRendererEnabled = true;

// Initialize your app...
```

By completing both setup steps, your application will output an HTML DOM structure instead of utilizing the WebGL canvas.
