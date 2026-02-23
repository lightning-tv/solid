## Introduction to Rendering in SolidJS with Lightning TV

In this snippet, we are utilizing SolidJS in conjunction with Lightning TV to render a simple "Hello World" text on the screen. SolidJS is a declarative JavaScript library for creating user interfaces, renowned for its performance and fine-grained reactivity. Lightning TV is a framework for building high-performance, animated TV applications. By combining these technologies, we can create dynamic and visually appealing interfaces optimized for TV environments.

```jsx
import { render, Text } from '@lightningtv/solid';

render(() => <Text>Hello World</Text>);
```

## Understanding the Integration of SolidJS and Lightning TV

It's very important to understand the concepts of SolidJS as that is the primary library for building the UI. SolidJS provides the foundation for creating reactive and efficient user interfaces, while the Lightning TV integration merely links SolidJS with the Lightning Renderer to create Canvas drawing. This combination allows for the creation of high-performance TV applications with smooth animations and responsive designs.

### Key Concepts in SolidJS

To effectively use this integration, familiarize yourself with the core concepts of SolidJS:

- **Reactivity**: SolidJS uses fine-grained reactivity to update the DOM. This means that only the parts of the DOM that need to change are updated, resulting in highly efficient rendering.
- **Components**: Components are the building blocks of a SolidJS application. They are functions that return JSX and can manage their own state and lifecycle.
- **JSX**: SolidJS uses JSX, a syntax extension for JavaScript that allows you to write HTML-like code within JavaScript. This makes it easy to define UI components declaratively.
- **State Management**: SolidJS provides reactive primitives such as signals, stores, and context to manage state within your application.

You can learn more about SolidJS from their [documentation](https://docs.solidjs.com/).

## Configuring the Renderer

Before calling the Render function, you can set rendererOptions.

```jsx
import { render, Config, Text } from '@lightningtv/solid';
import {
  WebGlCoreRenderer,
  SdfTextRenderer,
} from '@lightningjs/renderer/webgl';
import { Inspector } from '@lightningjs/renderer/inspector';

Config.rendererOptions = {
  fpsUpdateInterval: logFps ? 1000 : 0,
  fontEngines: [SdfTextRenderer],
  renderEngine: WebGlCoreRenderer,
  inspector: Inspector,
  // textureMemory: {
  //   criticalThreshold: 80e6,
  // },
  numImageWorkers, // temp fix for renderer bug
  // Set the resolution based on window height
  // 720p = 0.666667, 1080p = 1, 1440p = 1.5, 2160p = 2
  deviceLogicalPixelRatio: 1,
  devicePhysicalPixelRatio: 1,
};
render(() => <Text>Hello World</Text>);
```

For the latest renderer options read the official [renderer documentation](https://www.lightningjs.io/api/renderer/interfaces/Renderer.RendererMainSettings.html)

### Config.rendererOptions

- **appWidth**: Authored logical pixel width of the application.

  - _Default_: `1920`

- **appHeight**: Authored logical pixel height of the application.

  - _Default_: `1080`

- **txMemByteThreshold**: Texture Memory Byte Threshold. When the GPU VRAM used by textures exceeds this threshold, non-visible textures are freed. Set to `0` to disable.

- **boundsMargin**: Bounds margin to extend the boundary for adding a CoreNode as Quad. Can be a single number or an array of four numbers.

- **deviceLogicalPixelRatio**: Factor to convert app-authored logical coordinates to device logical coordinates. Supports auto-scaling for different resolutions.

  - _Default_: `1`

- **devicePhysicalPixelRatio**: Factor to convert device logical coordinates to device physical coordinates. Controls the number of physical pixels used per logical pixel.

  - _Default_: `window.devicePixelRatio`

- **clearColor**: RGBA encoded number for the background color.

  - _Default_: `0x00000000`

- **Texture Memory Manager Settings**:
  textureMemory?: Partial<TextureMemoryManagerSettings>;

- **fpsUpdateInterval**: Interval in milliseconds for receiving FPS updates. Set to `0` to disable.

  - _Default_: `0`

- **enableContextSpy**: Includes WebGL context call information in FPS updates. Significantly impacts performance.

  - _Default_: `false`

- **numImageWorkers**: Number of image workers to use. Improves image loading on multi-core devices. Set to `0` to disable.

  - _Default_: `2`

- **inspector**
  Optional. Allows inspection of the state of Nodes in the renderer, replicating the node state.
  Type: `typeof Inspector | false`.

- **renderEngine**
  Defines the rendering engine (WebGL or Canvas). WebGL is more performant, while Canvas is more broadly supported.
  Type: `typeof CanvasCoreRenderer | typeof WebGlCoreRenderer`.

- **quadBufferSize**
  Specifies the quad buffer size in bytes.
  Default: `4 * 1024 * 1024`.

- **fontEngines**
  Defines font engines for text rendering (CanvasTextRenderer for Canvas, SdfTextRenderer for WebGL). Enables tree shaking for unused engines.
  Default: `[]`. Type: `(typeof SdfTextRenderer | typeof CanvasTextRenderer)[]`.

### Additional Solid-Specific Configurations

Besides `rendererOptions`, the `Config` object exposes several properties specific to `@lightningtv/solid` runtime behavior:

- **debug**: `boolean` (Default: `false`)
  Enables general debug logging.
- **focusDebug**: `boolean` (Default: `false`)
  Logs focus management events to help debug spatial navigation.
- **keyDebug**: `boolean` (Default: `false`)
  Logs all key input events.
- **animationsEnabled**: `boolean` (Default: `true`)
  Global toggle to enable or disable animations.
- **animationSettings**: `AnimationSettings`
  Default configurations for animations.
  - _Default_: `{ duration: 250, easing: 'ease-in-out' }`
- **fontSettings**: `Partial<TextProps>`
  Default settings for all `<Text>` nodes globally.
  - _Default_: `{ fontFamily: 'Ubuntu', fontSize: 100 }`
- **fontWeightAlias**: `Record<string, number | string>`
  Maps font-weight names to specific font files or numeric values (e.g., `{ thin: 100, bold: 700 }`).
- **taskDelay**: `number`
  Delay interval in milliseconds for the Task Scheduler.
  - _Default_: `50`
- **focusStateKey**: `string`
  The property key used to identify the focused state styling.
  - _Default_: `'$focus'`
- **domRendererEnabled**: `boolean` (Default: `false`)
  Whether the DOM renderer should be used instead of the Lightning Canvas renderer.
- **simpleAnimationsEnabled**: `boolean`
  Allows simple CSS-like transition properties without full engine overhead.
- **throttleInput**: `number`
  Rate-limiting for key handling in milliseconds.
- **lockStyles**: `boolean` (Default: `true`)
  Enables locking on styles to prevent unintended overrides.
- **convertToShader**: `(node: ElementNode, v: StyleEffects) => IRendererShader`
  A customizable function that determines how styling effects translate to shaders on an ElementNode.
