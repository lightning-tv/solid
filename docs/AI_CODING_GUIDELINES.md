# AI Coding Guidelines for Lightning/Solid Framework

This document outlines the specific constraints, properties, and layout systems available in the Lightning/Solid framework. AI agents should strictly adhere to these rules to generate correct and functional code.

## Core Principles

1.  **Positioning System**:

    - All nodes are effectively `position: absolute`.
    - Positioning is controlled via `x`, `y`, `width`, `height`.
    - **Right / Bottom**: usage of `right` and `bottom` is supported for pinning elements to the parent's edges.
      - Setting `right` automatically implies `mountX: 1`.
      - Setting `bottom` automatically implies `mountY: 1`.
    - **Mounting**:
      - Default `mount` is **0, 0** (Top-Left corner).
      - `mount` (0-1) determines the anchor point of the element itself (0.5 = center).
      - **Avoid changing `mount` manually** unless specifically needed for centering (0.5) or specific anchor effects.
    - There is no "flow" layout by default unless `display: 'flex'` is explicitly used.

2.  **Dimensions**:

    - **Explicit Dimensions**: It is **important** to give elements explicit `width` and `height` whenever possible.
    - **Default Dimensions**: If `width` and `height` are **not** specified, the element will inherit the **parent's width and height**. This can lead to unexpected full-screen overlays if not managed carefully.

3.  **Flexbox Layout**:

    - **Must** set `display: 'flex'` on a container to enable flexbox.
    - **Important**: `padding` is a _single number_ only. There is NO `paddingLeft`, `paddingRight`, `paddingTop`, or `paddingBottom`.
    - **Margins**: Supported on flex items via `marginTop`, `marginBottom`, `marginLeft`, `marginRight`.
    - **Gap**: `gap`, `rowGap`, `columnGap` are supported.
    - **Alignment**: `justifyContent`, `alignItems`, `alignSelf` are strictly typed.

4.  **Styling Restrictions**:

    - **No** `background`. Use `color`.
    - **Color Format**: **Prefer Hex Strings** (e.g., `'#ff0000ff'`). **NO** named colors.
    - **No** `border-radius`. Use `borderRadius` (number).
    - **No** `border`. Use `border` object: `{ width: number, color: string }`.
    - **No** `box-shadow`. Use `shadow` object.
    - **No** CSS class names.

5.  **Props vs Styles**:
    - **Prefer Props**: Pass properties directly to the component (e.g., `<View x={10} y={10} color="#ff0000ff" />`).
    - Avoid using the `style` prop when possible.

## Available Properties

### Layout & Positioning

| Property                    | Type     | Notes                                                        |
| :-------------------------- | :------- | :----------------------------------------------------------- |
| `x`, `y`                    | `number` | Absolute position coordinates.                               |
| `right`                     | `number` | Distance from parent's right edge. **Implies `mountX: 1`**.  |
| `bottom`                    | `number` | Distance from parent's bottom edge. **Implies `mountY: 1`**. |
| `width` / `w`               | `number` | Explicit width. **Defaults to Parent Width** if unset.       |
| `height` / `h`              | `number` | Explicit height. **Defaults to Parent Height** if unset.     |
| `minWidth`, `minHeight`     | `number` | Minimum dimensions.                                          |
| `maxWidth`, `maxHeight`     | `number` | Maximum dimensions.                                          |
| `mount`, `mountX`, `mountY` | `number` | Anchor point. Default **0** (Top/Left).                      |
| `pivot`, `pivotX`, `pivotY` | `number` | Pivot point.                                                 |
| `rotation`                  | `number` | Rotation in radians.                                         |
| `scale`, `scaleX`, `scaleY` | `number` | Scaling factor.                                              |
| `alpha`                     | `number` | Opacity.                                                     |
| `zIndex`, `zIndexLocked`    | `number` | Stacking order.                                              |

### Flexbox Container Props

_Requires `display: 'flex'`_

| Property                     | Values / Type                                                                              | Notes                 |
| :--------------------------- | :----------------------------------------------------------------------------------------- | :-------------------- |
| `flexDirection`              | `'row' \| 'column'`                                                                        | Defaults to 'row'.    |
| `flexWrap`                   | `'nowrap' \| 'wrap'`                                                                       |                       |
| `justifyContent`             | `'flexStart' \| 'flexEnd' \| 'center' \| 'spaceBetween' \| 'spaceAround' \| 'spaceEvenly'` | Main axis alignment.  |
| `alignItems`                 | `'flexStart' \| 'flexEnd' \| 'center'`                                                     | Cross axis alignment. |
| `gap`, `rowGap`, `columnGap` | `number`                                                                                   | Space between items.  |
| `padding`                    | `number`                                                                                   | **Uniform only**.     |

### Flexbox Item Props

| Property                       | Type                                   | Notes                   |
| :----------------------------- | :------------------------------------- | :---------------------- |
| `flexGrow`                     | `number`                               |                         |
| `flexItem`                     | `boolean`                              | Set `false` to ignore.  |
| `alignSelf`                    | `'flexStart' \| 'flexEnd' \| 'center'` | Overrides `alignItems`. |
| `marginTop`, `marginBottom`... | `number`                               |                         |

### Visual Styles

| Property                     | Type                 | Notes                                                                    |
| :--------------------------- | :------------------- | :----------------------------------------------------------------------- |
| `color`                      | `string`             | **Hex String Preferred** (`'#ff0000ff'`).                                |
| `colorTop`, `colorBottom`... | `string`             | Gradient-like vertex coloring in hex string.                             |
| `linearGradient`             | `object`             | `{ angle?: number, colors: string[], stops?: number[] }`                 |
| `radialGradient`             | `object`             | `{ radius?: number, colors: string[], stops?: number[], ... }`           |
| `borderRadius`               | `number \| number[]` | Single radius or [tl, tr, br, bl].                                       |
| `border`                     | `object`             | `{ width: number, color: string }`.                                      |
| `shadow`                     | `object`             | `{ color: string, x: number, y: number, blur: number, spread: number }`. |

### Text Properties

| Property       | Type                             | Notes           |
| :------------- | :------------------------------- | :-------------- |
| `text`         | `string`                         | Content string. |
| `fontSize`     | `number`                         |                 |
| `fontFamily`   | `string`                         |                 |
| `fontWeight`   | `number \| string`               |                 |
| `lineHeight`   | `number`                         |                 |
| `textAlign`    | `'left' \| 'center' \| 'right'`  |                 |
| `wordWrap`     | `boolean`                        |                 |
| `maxLines`     | `number`                         | truncate text.  |
| `textOverflow` | `'clip' \| 'ellipsis' \| string` |                 |

## Strict "Do Not Use" List

| Invalid Property      | Correct Alternative                                    |
| :-------------------- | :----------------------------------------------------- |
| `background`          | Use `color`.                                           |
| Named colors          | Use hex strings (`'#ff0000ff'`).                       |
| `textColor`           | Use `color` on the Text node itself.                   |
| `paddingLeft`...      | Use `padding` (uniform) or `margin` props on children. |
| `border-style` string | Use `border` object.                                   |
| `display: 'grid'`     | Not supported. Use nested Flexboxes.                   |
| `className`           | Not supported.                                         |
| `style={{ ... }}`     | **Avoid**. Pass props directly to the component.       |

## Example Usage

### Incorrect ❌

```tsx
// 1. Missing dimensions (might default to full screen)
// 2. Using named colors
// 3. Using style object
<View
  style={{
    backgroundColor: 'red',
    paddingLeft: 20,
    borderRadius: '10px',
    display: 'flex',
  }}
>
  <Text textColor="white">Hello</Text>
</View>
```

### Correct ✅

```tsx
// 1. Explicit dimensions
// 2. Direct Props
// 3. Hex Strings
<View
  width={400} // Explicit Width
  height={200} // Explicit Height
  color="#ff0000ff" // Hex string
  padding={20} // Uniform padding
  borderRadius={10} // Number
  display="flex" // defaults to flexDirection row
>
  <Text color="#ffffffff">Hello</Text>
</View>
```
