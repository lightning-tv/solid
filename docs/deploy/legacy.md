# Using Solid & Lightning on Legacy < Chrome 49 Devices

SolidJS is a versatile web framework compatible with a wide range of browsers. It supports browsers as early as Chrome 38+, though it utilizes JavaScript [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), a feature introduced in Chrome 49.

Lightning, a WebGL renderer, employs a `<canvas>` tag. On PlayStation, WebGL is disabled, necessitating the use of `canvas2d` mode for Lightning. Both SolidJS and Lightning have been tested and confirmed working on Chrome 38+.

To ensure compatibility, you can test your setup with the hosted [TMDB Demo App](https://lightning-tv.github.io/solid-demo-app/). If you encounter any issues, please report them.

Chrome 38+ is available as early as:

- [LG WebOS 3+ (2016+)](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine)
- [Tizen (2017+)](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html)

## Running on Chrome 38

### Getting SolidJS Running Without Proxies

<img src="images/Chrome38.jpeg" alt="Solid on Chrome 38+" style="width: 45%;">

This was tested using [LambdaTest](https://www.lambdatest.com/) – I had to email their support team to ensure WebGL was enabled for my account.

## Avoiding SolidJS Stores (Requires Proxy)

SolidJS stores rely on JavaScript `Proxy`, which is unavailable in Chrome versions below 49. To maintain compatibility:

- **Use signals (`createSignal`) instead of stores.**
  - ✅ `const [count, setCount] = createSignal(0);`
  - ❌ `const count = createStore({ value: 0 });`

## Vite Legacy Build

In Vite, a "modern" build targets browsers that support native ES Modules (ESM), generating optimized bundles for modern browsers. A "legacy" build uses `@vitejs/plugin-legacy` to generate additional code for older browsers that lack native ESM support, including necessary polyfills.

### Key Differences:

#### Modern Build

- Default build option for Vite.
- Generates smaller bundles by leveraging native browser features like ESM.
- Faster build times due to reduced transpiling.
- Suitable for most modern browsers.

#### Legacy Build

- Requires `@vitejs/plugin-legacy`.
- Generates additional code to support older browsers lacking native ESM.
- Includes polyfills for missing JavaScript features.
- May result in slightly larger bundles compared to a modern build.

You can adjust your vite config to work with the different devices:

```js
plugins: [
    legacy({
      targets: ["defaults", "Chrome>=49"],
      // polyfills: ["es.promise.finally", "es/map", "es/set"],
      // additionalLegacyPolyfills: ["whatwg-fetch"],
      modernPolyfills: [
          // Safari 11 has modules, but throws > ReferenceError: Can't find variable: globalThis
          "es.global-this",
        ],
    }),
  ],
  build: {
    targets: ["chrome>=69"],
    minify: false,
    sourcemap: false,
  },
```
