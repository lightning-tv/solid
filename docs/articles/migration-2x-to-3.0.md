# Migration Guide: Lightning 3 v2.x to v3.0

This guide helps you migrate from Lightning 3 version 2.x to the new 3.0 release. The 3.0 version introduces several breaking changes to improve performance and the Solid integration has done a lot of under the hood changes to improve performance and reduce the amount of code you need to update.

To get the full list of changes from the renderer you can check the [changelog](https://github.com/lightning-tv/renderer/blob/main/CHANGELOG.md).

## Overview of Steps

1. Update to the latest version of the renderer beta (v3.0.0-beta20)
2. Update to the latest version of the solid 3.0.0
3. Remove references for @lightningtv/core -> use @lightningtv/solid instead
4. Update fonts.ts to new format (remove fontWeight information, add to fontFamily)
5. Double check your fontWeightAlias if needed
6. Import shaders in index.ts
7. Check <Text> components to fix possible alignment + centering issues
8. Add **DEV** flag to your vite.config.ts

### Fonts

`fontWeight` was removed from the renderer and is now polyfilled by Solid. When you load fonts with different weights, ie `Roboto` 400 and 700, you'll need to update your fonts with different fontFamily names:

```typescript
{
    type: "msdf",
    fontFamily: "Roboto",
    atlasDataUrl: basePath + "fonts/Roboto-Regular.msdf.json",
    atlasUrl: basePath + "fonts/Roboto-Regular.msdf.png"
  } as const,
  {
    type: "msdf",
    fontFamily: "Roboto700",
    atlasDataUrl: basePath + "fonts/Roboto-Bold.msdf.json",
    atlasUrl: basePath + "fonts/Roboto-Bold.msdf.png"
  } as const,
```

Notice we removed the descriptor with the weight. Long term you can just change the fontFamily to change fonts.

To help with migration we have exposed a fontWeightAlias that maps common font weights to their numeric values. You can override this in your config if needed.

```typescript
Config.fontWeightAlias = {
    thin: 100,
    light: 300,
    regular: '',
    400: '',
    medium: 500,
    bold: 700,
    black: 900,
},
```

Setting `fontWeight` to 700 is now a function that does the following:

```typescript
set fontWeight(v) {
  this._fontWeight = v;
  const family = this.fontFamily || Config.fontSettings?.fontFamily;
  const weight =
    (Config.fontWeightAlias &&
      (Config.fontWeightAlias[v as string] as number | string)) ??
    v;
  this.fontFamily = `${family}${weight}`;
}
```

#### Enhanced Font Metrics

Lightning 3.0 provides better font metrics support:

```typescript
// Recommended: Always provide font metrics for optimal rendering
await stage.loadFont('canvas', {
  fontFamily: 'MyFont',
  fontUrl: '/fonts/my-font.ttf',
  metrics: {
    ascender: 800, // Font ascender in font units
    descender: -200, // Font descender in font units
    lineGap: 0, // Additional line spacing
    unitsPerEm: 1000, // Font units per EM
  },
});
```

### Width/Height Property Changes

The `width` and `height` properties were changed in favor of shorter `w` and `h` properties for by the Lightning team.

Width and height are still available but are now polyfilled by Solid. Note that in some places like Shaders you may need to use `w` and `h` instead of `width` and `height`.

Oh and some properties are still `maxWidth` and `maxHeight`. 🤷

### Texture Loaded Event Changes

The texture loaded event now reports dimensions using `w` and `h` properties:

```typescript
// v2.x - Dimensions with width/height
node.on('loaded', (event) => {
  if (event.type === 'texture') {
    console.log('Texture loaded:', {
      width: event.dimensions.width, // ⚠️ No longer available
      height: event.dimensions.height, // ⚠️ No longer available
    });
  }
});

// v3.0 - Dimensions with w/h
node.on('loaded', (event) => {
  if (event.type === 'texture') {
    console.log('Texture loaded:', {
      w: event.dimensions.w, // ✅ Available
      h: event.dimensions.h, // ✅ Available
    });
  }
});
```

## Updated Shaders

Shaders are imported when needed by application. The following example shows how to import and register shaders:

```typescript
const { renderer, render } = createRenderer();
loadFonts(fonts);
// Prepare for RC3 of Renderer
import {
  Rounded,
  RoundedWithBorder,
  RoundedWithShadow,
  RoundedWithBorderAndShadow,
  RadialGradient,
  LinearGradient,
  HolePunch,
} from '@lightningjs/renderer/webgl/shaders';
const shManager = renderer.stage.shManager;
shManager.registerShaderType('rounded', Rounded);
shManager.registerShaderType('roundedWithBorder', RoundedWithBorder);
shManager.registerShaderType('roundedWithShadow', RoundedWithShadow);
shManager.registerShaderType(
  'roundedWithBorderWithShadow',
  RoundedWithBorderAndShadow,
);
shManager.registerShaderType('radialGradient', RadialGradient);
shManager.registerShaderType('linearGradient', LinearGradient);
shManager.registerShaderType('holePunch', HolePunch);
```

Be mindful some of the properties may have changed (like width/height).

## **DEV** flag

The renderer now uses the **DEV** flag to determine if it should run in development mode. This is a global variable that is set by the build process. You can set it in your vite.config.ts file like this:

```js
defineConfig(({ mode }) => ({
  define: {
    __DEV__: mode !== 'production',
  },
  // ...
}));
```
