# Virtual Row & Column Primitives

`VirtualRow` & `VirtualColumn` renders a dynamic slice of items from a larger dataset, displaying them in a horizontal row / column. It's designed to optimize performance for long lists by only rendering the items currently visible or nearby.

### Behavior

- Renders a 1D list of items.
- Uses `displaySize` to define the number of visible items.
- Uses `bufferSize` to pre-render additional items to the left and right of the visible window for smoother scrolling.
- Only a subset of the total items is rendered, improving performance.
- Triggers `onEndReached` when the user approaches the end of the list, allowing for infinite scrolling or fetching more data.
- Focus is updated and maintained internally, with optional control via `scrollToIndex`.
- `selected` can be set to an index in the total array of items.

### Example Usage

```tsx
import { VirtualRow, VirtualColumn } from './primitives/Virtual';

<VirtualRow
  x={100}
  y={100}
  displaySize={5}
  bufferSize={2}
  each={myItemsArray}
  onEndReached={loadMoreItems}
  onEndReachedThreshold={3}
  onSelectedChanged={updateContent}
  autofocus
>
  {(item, index) => <Thumbnail item={item()} index={index()} />}
</VirtualRow>;
```

### Props

- **each** (`readonly T[] | undefined | null | false`): The full list of items to be rendered.
- **displaySize** (`number`): Number of items per row (required).
- **bufferSize** (`number`): Number of items to pre-render above and below the visible area (default: `2`).
- **onEndReached** (`() => void`): Callback triggered when selection moves near the end of the list Requires `onEndReachedThreshold` to be set.
- **onEndReachedThreshold** (`number`): Number from end of items when `onEndReached` will be called (default: `undefined`).
- **children** (`(item: Accessor<T>, index: Accessor<number>) => JSX.Element`): Function that renders each item.
- **selected** (`number`): Initial selected index.
- **autofocus** (`boolean`): If `true`, the component will auto-focus the first item on mount.
- **onSelectedChanged** (`OnSelectedChanged`): Optional callback triggered when selection changes.

Use `cursor` property on the node to get the absolute index in the list of items.

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
