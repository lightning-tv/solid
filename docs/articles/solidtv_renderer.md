# SolidTV Renderer

The SolidTV Renderer is a fork of the official Lightning Renderer optimized to be 50% faster during render loop. It is designed to be easily swapped with the standard LightningJS version to provide an immediate performance boost for your applications.

## Installation

The renderer is available on NPM under the `@lightningtv/renderer` package. You can install it via your package manager:

```bash
npm install @lightningtv/renderer
```

Or edit your package.json with:

```json
"@lightningjs/renderer": "npm:@lightningtv/renderer@3.2.5",
```

## Configuration (Vite Defines)

The SolidTV Renderer exposes several flags that can be configured via Vite defines in your `vite.config.ts`. These allow you to fine-tune the renderer's behavior for development, debugging, and production environments.

```js
define: {
      __DEV__: mode !== 'production',
      __RTT__: true,
      __renderTextBatching__: true,
      __enableAutosize__: false,
      __enableCompressedTextures__: false,
      __calculateFps__: mode !== 'production',
      __dirtyQuadBuffer__: true,
      __emitBoundsEvents__: false,
    },
```

### `__DEV__`

**Type:** `boolean` | **Default:** `undefined` (resolves `isProductionEnvironment` to `true`)

Toggles development mode. When set to `true`, it enables development-specific features, warnings, and unoptimized paths useful for debugging. In production, this should be `false` or left undefined.

### `__RTT__`

**Type:** `boolean` | **Default:** `true`

Enables or disables Render To Texture (RTT). This allows offscreen rendering of complex component trees into a static texture, which can significantly improve rendering performance for static content.

### `__renderTextBatching__`

**Type:** `boolean` | **Default:** `true`

Enables batching for text rendering. When enabled, the renderer batches text draw calls together, reducing overall overhead and improving text-heavy application performance. This will place Text on top of other elements. If you find Text over an element that should be on top of Text, add a zIndex to create a new layer for text.

### `__enableAutosize__`

**Type:** `boolean` | **Default:** `false`

Enables automatic size calculations for elements based on their content. Turning this on can have a performance cost, so it defaults to `false`. Images will still work with autosize. This shouldn't be needed as Solid has flex which can calculate sizes.

### `__enableCompressedTextures__`

**Type:** `boolean` | **Default:** `false`

Enables support for compressed texture formats. Using compressed textures can significantly reduce memory usage and improve loading times, especially on constrained devices. However most folks are not using compressed textures, so this is disabled by default. ktx, pvr are the two supported formats for compressed textures.

### `__calculateFps__`

**Type:** `boolean` | **Default:** `!isProductionEnvironment`

Calculates and exposes frames per second (FPS) metrics. By default, it is active in development mode (`__DEV__ = true`) but disabled in production to avoid unnecessary overhead.

### `__dirtyQuadBuffer__`

**Type:** `boolean` | **Default:** `true`

An optimization technique that maintains a dirty quad buffer to reduce unnecessary recalculations during rendering updates.

### `__emitBoundsEvents__`

**Type:** `boolean` | **Default:** `false`

When enabled, the renderer will emit events whenever an element's bounding box recalculates or changes. This can be useful for advanced layout tracking or debugging but may add overhead if heavily utilized.
