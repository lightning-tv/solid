# Layout and Positioning Elements

To ensure that elements are rendered on the screen correctly, they must have the following properties:

- **`x`**: The x position of the element in pixels, relative to its parent. Negative values are allowed.
- **`y`**: The y position of the element in pixels, relative to its parent. Negative values are allowed.
- **`right`**: Sets mountX: 1 and the x position of the element relative to its parent from the right of the container.
- **`bottom`**: Sets mountY: 1 and the y position of the element relative to its parent from the bottom of the container.
- **`width`**: The width of the element in pixels.
- **`height`**: The height of the element in pixels.

If width and height values are not specified, components will inherit these dimensions from their parent, minus their `x` and `y` values. The default values for `x` and `y` are 0, 0.

The `<Text>` component does not require any of these properties, as it will use the default text properties found in `Config`. The height of a `<Text>` node equals it's `lineHeight` or `fontSize` and the width is calculated after it's rendered.

## Flex

A fundamental tool for layout is the Flex container. Currently, there is a minimal implementation of flex (`display: flex`) that supports the following properties: `flexDirection`, `justifyContent`, `alignItems`, `flexOrder`, `flexGrow` and `gap`. This is useful for laying out elements in rows and columns.

### New Flex Engine Toggle

The framework now includes a modern, high-performance, CSS-aligned flex engine alongside the legacy engine. To opt into the new flex engine, define the following environment variable during your Vite build process:

```bash
VITE_USE_NEW_FLEX=true
```

This will add `flexShrink`, `flexBasis` support and padding / margin full support with array syntax.

Because the engines are conditionally evaluated at build time via `import.meta.env`, your bundler (e.g., Rollup) will automatically perform **Dead-Code Elimination (tree-shaking)**. This means whichever layout engine isn't selected will be completely omitted from your application's final production bundle.

### Example

```jsx
import { View, Text } from '@lightningtv/solid';

const RowStyles = {
  display: 'flex',
  justifyContent: 'flexStart',
  width: 1760,
  height: 300,
  gap: 26,
  y: 400,
};

<View style={RowStyles}>
  <Text>TV Shows</Text>
  <Text>Movies</Text>
  <Text>Sports</Text>
  <Text>News</Text>
</View>;
```

When a `View` with `display: flex` contains text nodes as children, it automatically sets up a listener for the text to load, sets the width and height of the text elements, and then calls `updateLayout` on the container to recalculate the flex layout.

### Flex Properties

- **`alignItems`**: 'flexStart' | 'flexEnd' | 'center'
- **`display`**: 'flex' | 'block' (to disable flex on Row & Column)
- **`direction`**: 'ltr' | 'rtl' display items from left to right or right to left. ltr is the default.
- **`flexDirection`**: 'row' | 'column' | 'row-reverse' | 'column-reverse'
- **`flexBoundary`**: 'contain' | 'fixed' (Default updates container size based on children size with `justifyContent: flexStart | flexEnd`. Set to `fixed` to use parent width when width isn't set.)
- **`flexItem`**: boolean (Set to `false` on a child to exclude it from flex calculations.)
- **`flexOrder`**: number (Set the order on children to change the layout order.)
- **`flexGrow`**: number (Set to number on children to specify how much room elements should take up.)
- **`flexShrink`**: number (Set to number on children to specify how much an element should shrink proportionally if the container overflows. Defaults to 0.) Only in new flex engine.
- **`flexBasis`**: number | 'auto' (Set the default size of an item before the remaining space is distributed. Overrides width/height.) Only in new flex engine.
- **`flexWrap`**: 'nowrap' | 'wrap' | 'wrap-reverse' (Set to `wrap` or `wrap-reverse` to have elements flow to the next line on overflow.)
- **`gap`**: number
- **`justifyContent`**: 'flexStart' | 'flexEnd' | 'center' | 'spaceBetween' | 'spaceEvenly'

### Flex Grow

Flex grow is useful for laying out items where one item you may not know the size and you want the other items to take up the remainder of the space:

```jsx
<View width={600} display="flex" gap={20} height={42} y={100} x={150}>
  <Text fontSize={42}>Flex Grow</Text>
  <View flexGrow={1} height={4} y={19} color={'#ff3000'} />
</View>
```

Produces:
![Flex Grow](../images/flexGrow.png)

We can also have multiple elements with flexGrow property. Flex will divide up the remaining space and give flexGrow \* size to each item.

```jsx
<View width={600} display="flex" gap={20} height={42} y={100} x={150}>
  <Text fontSize={42}>Flex Grow</Text>
  <View flexGrow={1} height={4} y={19} color={'#ff3000'} />
  <View flexGrow={3} height={4} y={19} color={'#ff30ff'} />
  <View flexGrow={1} height={4} y={19} color={'#003C0F'} />
</View>
```

Produces:
![Flex Grow](../images/flexGrow-multiple.png)

### Item-Specific Properties in flex containers

To control the layout further, you can use the following properties on individual items:

- **`padding`**: number (Specifies padding on the element itself on main axis. Only in legacy flex engine.)

- **`padding`**: number | [number, number, number, number] (Specifies padding on the element itself. Using an array aligns with the CSS `[Top, Right, Bottom, Left]` specification. Available in the new flex engine.)
- **`paddingTop`**: number (Overrides the top value of the padding array. Available in the new flex engine.)
- **`paddingRight`**: number (Overrides the right value of the padding array. Available in the new flex engine.)
- **`paddingBottom`**: number (Overrides the bottom value of the padding array. Available in the new flex engine.)
- **`paddingLeft`**: number (Overrides the left value of the padding array. Available in the new flex engine.)
- **`margin`**: [number, number, number, number] (Specifies margins on the element using the `[Top, Right, Bottom, Left]` CSS array syntax. Available in the new flex engine.)
- **`marginBottom`**: number
- **`marginLeft`**: number
- **`marginRight`**: number
- **`marginTop`**: number

Note: `alignItems` supports `flexStart`, `flexEnd`, and `center`, but requires the container to have a height/width set.

## Layout Callbacks

When a container with `display: flex` undergoes layout during initial rendering, `updateLayout` is called to calculate the flex layout. You can use `onLayout` hooks to update the element with after flex has performed it's calculations and all text nodes have been loaded.

- **`onLayout`**: Use this callback to update the element after flex calculation.

If you ever need to re-render a child element, call `updateLayout` on the parent to perform the layout again. You can also set `updateLayoutOn` prop to a signal which calls updateLayout whenever the prop changes. Lastly, when a flex container has an element added or removed, it will automatically call `updateLayout`.
