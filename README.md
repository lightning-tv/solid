<p>
  <img src="https://assets.solidjs.com/banner?project=Library&type=@lightningtv/solid" alt="SolidJS Lightning" />
</p>

# SolidJS for LightningJS

Is a UI framework for [LightningJS 3 Renderer](https://lightningjs.io/) built with [SolidJS](https://www.solidjs.com/) Universal Renderer. It allows you to declaratively construct lightning nodes with reactive primitives, with incredible performance.

## Need Support?

[ConnectedTV Dev](https://lightningtv.dev/)

Join the [SolidJS Discord](https://discord.com/invite/solidjs) - #Lightning TV channel and message chiefcll

## Documentation

[SolidJS Lightning Docs](https://lightning-tv.github.io/solid/)

## Demo App

[Solid TMDB Demo App](https://github.com/lightning-tv/solid-demo-app)

Tested and working on Chrome < 38 and could go earlier

## Playground

[playground.solidjs.com](https://playground.solidjs.com/anonymous/b36869ea-e7df-4f7a-af34-67222bc04271)

## Quick Start

Clone starter template:

```sh
> npx degit lightning-tv/solid-starter-template my-app
> cd my-app
> npm i # or yarn or pnpm
> npm start # or yarn or pnpm
```

## Video Quick (actually it's long) Start

[![Watch the video](https://img.youtube.com/vi/9UU7Ntf7Tww/0.jpg)](https://www.youtube.com/watch?v=9UU7Ntf7Tww)

Read the article:
https://medium.com/@chiefcll/lightning-3-the-basics-of-solidjs-e6e21d73205e

### Hello World

```jsx
import { render, Text } from '@lightningtv/solid';

render(() => <Text>Hello World</Text>);
```

For a more detailed Hello World guide check out the [Hello World](HelloWorld.md) guide.

## Migration Guide from previous repo:

If you're migrating from https://github.com/lightning-js/solid

Find and replace:
"@lightningjs/solid-primitives" with "@lightningtv/solid/primitives"
"@lightningjs/solid" with "@lightningtv/solid"

Update vite.config to dedupe solid:

```js
resolve: {
    dedupe: [
      "solid-js",
      "@lightningtv/solid",
      "@lightningtv/solid/primitives",
      "@lightningjs/solid-ui",
    ],
  },
```

If you don't want to find and replace you can use alias

```js
resolve: {
    alias: {
      theme: "@lightningjs/l3-ui-theme-base",
      "@lightningjs/solid": "@lightningtv/solid",
      "@lightningjs/solid-primitives": "@lightningtv/solid/primitives",
    },
  },
```
