## LazyRow and LazyColumn Primitives

`LazyRow` and `LazyColumn` are components designed to lazily render a list of items. These components improve performance by only rendering a subset of items initially and dynamically loading additional items as the user navigates.

### Behavior

- **LazyRow** renders items in a horizontal row and listens for `onRight` key presses to load more items.
- **LazyColumn** renders items in a vertical column and listens for `onDown` key presses to load more items.
- The `upCount` prop determines how many items are initially rendered.
- Additional items are loaded incrementally as the user navigates.
- If `sync` is `true`, all `upCount` items are loaded immediately.

### lazyScrollToIndex

You can also `lazyScrollToIndex` by using a ref on LazyRow or LazyColumn, simply `rowRef.lazyScrollToIndex(3)`

### Example Usage

```javascript
import { LazyRow } from '@lightningtv/solid/primitives';

<LazyRow upCount={4} delay={250} each={local.items} style={styles.Row}>
  {(item, index) => <Thumbnail {...item} key={index} />}
</LazyRow>;
```

### Props

- **each** (`T | undefined | null | false`): The array of items to be rendered.
- **fallback** (`JSX.Element`): Optional fallback element displayed if `each` is empty or undefined.
- **container** (`JSX.Element`): Optional container element for wrapping items.
- **upCount** (`number`): Number of items to render initially.
- **delay** (`number`): Delay in milliseconds before loading additional items (default: `0`).
- **sync** (`boolean`): If `true`, preloads `upCount` items immediately instead of incrementally loading.
- **eagerLoad** (`boolean`): If `true`, loads all the items after upCount using scheduleTask.
- **children** (`(item: T[number], index: number) => JSX.Element`): A function that returns a JSX element for each item.

### Performance Optimization

- Dynamically slices the `each` array based on `offset`.
- Uses `setTimeout` (with optional `delay`) to stagger item loading for smoother rendering during animations.
- When `sync` is `true`, skips incremental loading for immediate rendering of `upCount` items.

These components help optimize rendering performance, particularly when dealing with large lists or slow-loading content.
