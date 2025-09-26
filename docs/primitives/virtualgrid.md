# VirtualGrid Primitive

`VirtualGrid` renders a dynamic slice of items based on the currently selected index and lays out the items in Grid format by using flex wrap.

### Behavior

- Renders a 2D grid of items using `columns` and `rows`.
- Uses `buffer` to pre-render additional rows above and below the visible window.
- Only a subset of the total items is rendered, improving performance.
- Handles directional navigation (`onUp`, `onDown`, `onLeft`, `onRight`) using built-in key handlers.
- Automatically scrolls vertically when the user navigates to a new row.
- Triggers `onEndReached` when the user approaches the end of the list. Allowing fetching additional items
- Focus is updated and maintained internally, with optional control via `scrollToIndex`.
- `selected` can be set to the index in the total array of items (which can be gotten from the cursor property)

### Example Usage

```tsx
import { VirtualGrid } from './components/VirtualGrid';

<VirtualGrid
  x={160}
  y={24}
  width={1620}
  scroll="always"
  autofocus
  rows={7}
  columns={2}
  buffer={2}
  each={provider().pages()}
  onEnter={onEnter}
  onEndReached={onEndReached}
  onEndReachedThreshold={15}
  onSelectedChanged={updateContentBlock}
  announce={`All Trending ${props.params.filter}`}
>
  {(item) => <Thumbnail item={item()} />}
</VirtualGrid>;
```

### Props

- **each** (`readonly T[] | undefined | null | false`): The full list of items to be rendered.
- **itemsPerRow** (`number`): Number of items per row (required).
- **numberOfRows** (`number`): Number of visible rows (default: `1`).
- **rowsBuffer** (`number`): Number of rows to pre-render above and below the visible area (default: `2`).
- **onEndReached** (`() => void`): Callback triggered when selection moves near the end of the list Requires `onEndReachedThreshold` to be set.
- **onEndReachedThreshold** (`number`): Number from end of items when `onEndReached` will be called (default: `undefined`).
- **children** (`(item: Accessor<T>, index: Accessor<number>) => JSX.Element`): Function that renders each item.
- **selected** (`number`): Initial selected index.
- **autofocus** (`boolean`): If `true`, the component will auto-focus the first item on mount.
- **onSelectedChanged** (`OnSelectedChanged`): Optional callback triggered when selection changes.
- **onLeft / onRight / onUp / onDown** (`KeyHandler`): Optional directional key handlers.
- **ref** (`RefSetter`): Ref to access the underlying view element.
- **style** (`NodeStyles`): Custom style object; merged with internal layout styles.

### Performance Optimization

- Renders only a subset of the full list (`slice`) for improved memory and render-time performance.
- Automatically re-calculates the slice on selection or data change.
- Reuses Children components
- Merges styles with internal layout defaults:

  - `display: flex`, `flexWrap: wrap`, `gap: 30`
  - `transition: { y: 250ms ease-out }`

### Focus & Navigation

- Focus is managed via `selected` and handled automatically when navigating.
- Navigation jumps vertically by row (`onUp`, `onDown`) and horizontally by item (`onLeft`, `onRight`).
- When the selected index crosses a row boundary, the slice is updated and the grid scrolls accordingly.
- Internal `onSelectedChanged` adjusts for slice-relative index offset to maintain correct selection.
