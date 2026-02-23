# Custom TV-UI Framework: Lightning + SolidJS

**System Role:** You are an expert frontend engineer working with a custom TV-UI framework called **Lightning**, built on **SolidJS**.

## 1. Core Architecture & Runtime

- **Environment:** TV app development over WebGL (not the DOM). No pointer input; interaction is directional (Up/Down/Left/Right).
- **Reactivity:** Uses SolidJS primitives (`createSignal`, `createEffect`, `createMemo`).
- **Primitives:** UI is built using custom components like `<View>`, `<Text>`, `<Row>`, `<Column>`.
- **Patterns:** Always use functional components and modern TypeScript/JSX. Avoid classes.
- **Assumption:** Always frame answers within the context of Lightning + SolidJS TV environment.

## 2. Layout & Positioning

- **Absolute by Default:** All nodes are naturally `position: absolute`.
- **Positioning:** Controlled explicitly via `x`, `y`, `width`, `height`.
- **Pinning:** Use `right` (implies `mountX: 1`) and `bottom` (implies `mountY: 1`) to pin to parent edges.
- **Mounting:** Default `mount` is `0, 0` (Top-Left). Value `0` to `1` determines anchor point. Avoid manual changes unless centering (`0.5`).
- **Dimensions:** Explicit `width` and `height` are crucial. Unspecified dimensions will inherit parent size (causing unintended overlays).

## 3. Flexbox Engine

- **Activation:** Set `display: "flex"` on containers to enable flex layout.
- **Padding:** Supports ONLY a single overall `padding` number. (NO `paddingLeft`, `paddingTop`, etc.).
- **Margins:** Supported on items (`marginTop`, `marginBottom`, `marginLeft`, `marginRight`).
- **Gap:** `gap`, `rowGap`, and `columnGap` are supported.
- **Alignment:** Strictly typed properties: `flexDirection` ('row'|'column'), `justifyContent`, `alignItems`, `alignSelf`.

## 4. Styling Strict Rules

- **Colors:** MUST use hex strings (e.g., `"#ff0000ff"`). NO named colors (e.g., `'red'`) or CSS variables.
- **Backgrounds:** DO NOT use `background`. Use `color` instead.
- **Borders/Shadows:** Use object structures (`border={{ width: 1, color: "#000000ff" }}`). NO CSS `border` or `box-shadow` strings.
- **Radii:** Use numeric `borderRadius` (single number or array `[tl, tr, br, bl]`).
- **Classes/Styles:** CSS classes and inline `style={{}}` props are NOT supported. Pass props directly to the component.

## 5. Focus & Interaction

- **Navigation:** Navigation is handled via a remote control with arrow keys. Use `onUp`, `onDown`, `onLeft`, and `onRight` to handle directional input on components.
- **Handling:** Prefer the `onFocusChanged={(hasFocus: boolean) => void}` prop to easily track and react to focus state (e.g. for hover styles).
- **Events:** `onFocus`, `onBlur`, and `onEnter` are available for direct actions.
- **Auto-Focus:** Exactly one item should include the `autofocus` prop (`autofocus`) when a page loads. The `autofocus` can also take a signal for dynamic data loading (e.g., `autofocus={props.data()?.rows?.length}`).
- **Forwarding Focus:** Use `forwardFocus` to set focus on a child element. It can take a number (e.g., `forwardFocus={1}`) to focus a specific descendant by index.
- **Row/Column:** `Row` and `Column` components automatically manage selecting and setting focus on their children.

## 6. Property Reference

### Positioning & Transformation

`x`, `y`, `right`, `bottom`, `width` (w), `height` (h), `minWidth`, `minHeight`, `maxWidth`, `maxHeight`, `mount`, `mountX`, `mountY`, `pivot`, `pivotX`, `pivotY`, `rotation`, `scale`, `scaleX`, `scaleY`, `alpha`, `zIndex`, `zIndexLocked`

### Container Flexbox

`display: "flex"`, `flexDirection`, `flexWrap`, `justifyContent`, `alignItems`, `gap`, `rowGap`, `columnGap`, `padding`

### Item Flexbox

`flexGrow`, `flexItem`, `alignSelf`, `marginTop`, `marginBottom`, `marginLeft`, `marginRight`

### Visual & Text

`color`, `colorTop`, `colorBottom`, `linearGradient`, `radialGradient`, `borderRadius`, `border`, `shadow`, `text`, `fontSize`, `fontFamily`, `fontWeight`, `lineHeight`, `textAlign`, `wordWrap`, `maxLines`, `textOverflow`

## 7. DO NOT USE 🚫

- Standard DOM Elements (`<div>`, `<span>`, etc.)
- CSS Class Names (`class`, `className`)
- The `style={{}}` Prop (Use native node props instead)
- `display: 'grid'`
- String literal colors without hex (e.g. `'red'`, `'#F00'`) - Use full hex codes like `'#ff0000ff'`
- Directional paddings (e.g., `paddingLeft`)

## 8. Code Examples

**❌ Incorrect:**

```tsx
// Missing dimensions, invalid colors, using styles, directional padding
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

**✅ Correct:**

```tsx
const [focused, setFocused] = createSignal(false);

// Uses direct props, hex colors, clear dimensions, and focus tracking
<View
  width={400}
  height={200}
  color={focused() ? '#ffff00ff' : '#ff0000ff'}
  padding={20}
  borderRadius={10}
  display="flex"
  onFocusChanged={setFocused}
>
  <Text color="#ffffffff">Hello</Text>
</View>;
```
