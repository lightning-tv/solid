<p>
  <img src="https://assets.solidjs.com/banner?project=Library&type=solid-lightning" alt="SolidJS Lightning" />
</p>

# SolidJS for Lightning 3

Solid-Lightning is a UI framework for the [Lightning 3 Renderer](https://github.com/lightning-js/renderer) built with [SolidJS](https://www.solidjs.com/) [Universal Renderer](https://github.com/solidjs/solid/releases/tag/v1.2.0). It allows you to declaratively construct lightning nodes with reactive primitives, just as you would construct a DOM tree in SolidJS.

### Other Resources

- [Solid Lightning Primitives](https://github.com/lightning-js/solid-primitives)
- [Solid UI Components](https://github.com/lightning-js/ui-components)

## Why Solid

- [Fastest, full featured frontend framework](https://dev.to/ryansolid/introducing-the-solidjs-ui-library-4mck)
- Established - Solid is widely used in production since 2018 with large community
  - [Router](https://github.com/solidjs/solid-router)
  - [Primitive Libraries](https://github.com/solidjs-community/solid-primitives)
  - [Tons of documentations](https://docs.solidjs.com/)
  - [Tutorials with lots of examples]()
  - [Playground](https://playground.solidjs.com/)
- Familiar and easy to use JSX + React like syntax
- Typescript support
- [Lightning UI Library](https://github.com/lightning-js/ui-components) of components with Theming

## Quick Start

Clone starter template:

```sh
> npx degit lightning-js/solid-starter-template my-app
> cd my-app
> npm i # or yarn or pnpm
> npm start # or yarn or pnpm
```

## Video Quick Start

[![Watch the video](https://img.youtube.com/vi/mWJ9CEiizeE/0.jpg)](https://www.youtube.com/watch?v=mWJ9CEiizeE)

## Global Config

Solid provides a global `Config` object to setup application defaults:

```js
import { Config } from '@lightningtv/solid';

// Log out solid rendering information
// This is removed for Prod builds for performance
Config.debug = false;

//Animations (transitions) are enabled by default
//This will disable all transitions, but not .animate calls
Config.animationsEnabled = true;

Config.animationSettings: {
  duration: 250,
  easing: 'ease-in-out',
};

// Set defaults for all <Text>
Config.fontSettings.fontFamily = 'Ubuntu';
Config.fontSettings.color = 0xffffffff;
Config.fontSettings.fontSize = 30;

//Renderer Options
Config.rendererOptions = {
  coreExtensionModule: coreExtensionModuleUrl,
  enableInspector: false,
  appWidth: 1920,
  appHeight: 1080,
  deviceLogicalPixelRatio: 1,
};

```

## Table of Contents

- [Getting started](getting_started.md)
- [Components & Events](components.md)
- [Styling](styling.md)
- [Positioning and Layout](layout.md)
- [Focus / Key Handling](keyhandling.md)
- [States](states.md)
- [Transitions (animations)](transitions.md)
- [Images](images.md)
- [Shaders and Effects](effects.md)
- [Accessibility / Announcer](a11y.md)
