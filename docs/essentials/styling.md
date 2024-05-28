# Styling / Supported Properties

You can add styles to your JSX components using object notation or applying the properties directly to the JSX or via a ref:

```jsx
import { createEffect, createSignal } from 'solid-js';

let columnRef;
const Column = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flexStart',
  width: 1760,
  height: 500,
  gap: 50,
  y: 200,
  x: 80,
  color: '00000000',
};

createEffect(() => {
  columnRef.x = 200;
});

const [alpha, setAlpha] = createSignal(1);

<View ref={columnRef} alpha={alpha()} y={90} style={Column}>
  // ...add some children
</View>;
```

The `style` attribute accepts an object of properties that are passed to the Lightning Renderer when the component is initially created. Once set, the `style` object remains read-only and will not be reapplied if it changes after the initial creation. This read-only nature allows the `style` object to be reused across multiple components. However, properties specified directly in the JSX will take precedence over those in the `style` object, enabling you to override styles for individual components. After the component is created, you can update properties via signals or imperatively using a reference to the component.

For UI component libraries, you can also pass an array (including nested arrays) to the `style` attribute, facilitating easy chaining of styles. Note that this does not perform a deep merge, so any state-specific styles will be overridden by the top-level style. Additionally, styles are applied in the order they appear in the array, meaning `props.style` will override `styles.Container`.

```jsx
const Top: Component<TopProps> = (props: TopProps) => {
  return (
    <ChildComp
      {...props}
      style={[props.style, styles.Container]}
      onSelectedChanged={chainFunctions(props.onSelectedChanged, withScrolling(props.y as number))}
    />
  );
};
```

## List of Properties

These are found in the Renderer and applicable to all nodes:

- `x`: The x coordinate of the Node's Mount Point, default is `0`.
- `y`: The y coordinate of the Node's Mount Point, default is `0`.
- `width`: The width of the Node, default is `0`.
- `height`: The height of the Node, default is `0`.
- `alpha`: The alpha opacity of the Node, ranging from `0` (transparent) to `1` (opaque), default is `1`.
- `autosize`: When enabled, the Node resizes to the dimensions of its texture, default is `false`.
- `clipping`: Prevents drawing outside the Node's bounds, default is `false`.
- `color`: The color of the Node in 0xRRGGBBAA format, default is `0xffffffff` (opaque white).
- `colorTop`: The color of the Node's top edge for gradient rendering.
- `colorBottom`: The color of the Node's bottom edge for gradient rendering.
- `colorLeft`: The color of the Node's left edge for gradient rendering.
- `colorRight`: The color of the Node's right edge for gradient rendering.
- `colorTl`: The color of the Node's top-left corner for gradient rendering.
- `colorTr`: The color of the Node's top-right corner for gradient rendering.
- `colorBr`: The color of the Node's bottom-right corner for gradient rendering.
- `colorBl`: The color of the Node's bottom-left corner for gradient rendering.
- `parent`: The Node's parent Node, `null` if it has no parent, default is `null`.
- `zIndex`: The Node's z-index.
- `texture`: The Node's Texture, `null` if not set.
- `shader`: The Node's Shader, `null` if not set.
- `src`: Image URL to set the Node's texture.
- `zIndexLocked`: The Node's locked z-index.
- `scale`: Scale to render the Node at, default is `1.0`.
- `scaleX`: Scale to render the Node at (X-Axis), default is `1.0`.
- `scaleY`: Scale to render the Node at (Y-Axis), default is `1.0`.
- `mount`: Combined position of the Node's Mount Point, default is `0` (top-left).
- `mountX`: X position of the Node's Mount Point, default is `0`.
- `mountY`: Y position of the Node's Mount Point, default is `0`.
- `pivot`: Combined position of the Node's Pivot Point, default is `0.5` (center).
- `pivotX`: X position of the Node's Pivot Point, default is `0.5`.
- `pivotY`: Y position of the Node's Pivot Point, default is `0.5`.
- `rotation`: Rotation of the Node in radians.
- `rtt`: Whether the Node is rendered to a texture, default is `false`.

### SDF Text Nodes

Text node properties available from the Renderer

- `text`: string
- `textAlign`: `'left' | 'center' | 'right'`
- `color`: number
- `x`: number
- `y`: number
- `contain`: `'none' | 'width' | 'both'`
- `width`: number
- `height`: number
- `scrollable`: boolean
- `scrollY`: number
- `offsetY`: number
- `letterSpacing`: number
- `lineHeight`: number
- `maxLines`: number
- `textBaseline`: TextBaseline
- `verticalAlign`: TextVerticalAlign
- `overflowSuffix`: string

### Solid Shortcuts

The following props are aliases to help with layout and ShaderEffects:

- `alignItems`: 'flexStart' | 'flexEnd' | 'center'
- `border`: BorderStyle
- `borderBottom`: BorderStyle
- `borderLeft`: BorderStyle
- `borderRadius`: number | number[]
- `borderRight`: BorderStyle
- `borderTop`: BorderStyle
- `display`: 'flex' | 'block'
- `effects`: any
- `flexDirection`: 'row' | 'column'
- `gap`: number
- `justifyContent`: 'flexStart' | 'flexEnd' | 'center' | 'spaceBetween' | 'spaceEvenly'
- `linearGradient`: any
- `marginBottom`: number
- `marginLeft`: number
- `marginRight`: number
- `marginTop`: number
- `transition`: Record<string, AnimationSettings> | true

### Component Defaults

`<View>` components without specified width and height values will inherit the dimensions of their parent, adjusted by their `x` and `y` values. If `x` and `y` are not specified, they default to 0, 0. The `<Text>` component does not require any properties. When placed inside a flex container, the `<Text>` component will automatically update its width and height upon loading.

### Colors

RGBA number 0xRRGGBBAA. If you want to use hex, `import { hexColor } from '@lightningtv/solid'` and do `hexColor('#c0ffee')` to convert colors to RGBA. Please know all hex colors are #RRGGBB so they are easy to convert to 0xRRGGBBAA and usually AA is ff for full alpha. By default, every node without a src attribute will have their color set to `0x00000000` making it transparent. If you have an element which sets it's src attribute after creation, you need to update color to `0xffffffff` so it's not transparent.

## Effects

### Border and borderRadius

`border` and `borderRadius` are special props which create effects for the DynamicShader found in the Lightning Renderer. These props can be set on the JSX or style object. The order in which you set the props determine how they are applied in the shader. Meaning you probably want to set borderRadius first. You can also set individual borders via `borderLeft`, `borderRight`, `borderTop`, `borderBottom`. These properties do not support animations.

```
const style = {
  borderRadius: 30,
  border: { width: 10, color: 0x000000ff }
}

// or

const style = {
  borderLeft: { width: 10, color: 0x000000ff },
  borderRight: { width: 10, color: 0x000000ff }
}

```

### linearGradient

`linearGradient` is another special effect that can be used like a style with following syntax.

```
linearGradient:
    {
      angle: 225,
      stops: [0.1, 0.5],
      colors: [
        0xff0000ff, 0x00000000,
      ],
    },
```

You can have as many stops or colors as you like. Note: linearGradient has a high performance price at this time. Instead, use PNG with alpha transparency.
