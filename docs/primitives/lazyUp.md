## LazyUp Primitive

`LazyUp` is a component designed to lazy render a list of items. Given a row of items which extends off the page, you can set an upCount equal to the number of visible rows or items that are visible on the screen. As the user presses Right or Down, a new item will be rendered to the screen for each keypress. The LazyUp is essentially a `<For>` loop which takes your items array and slices it to upCount, adding one item at a time as the user needs it. This reduces the number of items needed to be created at once speeding up page loads.

### Example

To use the `LazyUp` component:

```javascript
import { LazyUp } from '@lightningtv/solid/primitives';

<LazyUp
  component={Row}
  direction="row"
  upCount={4}
  each={local.items}
  style={styles.Row}
>
  {(item) => <Thumbnail {...item} />}
</LazyUp>;
```

### Props

- **each** (`T | undefined | null | false`): The array of items to be rendered.
- **fallback** (`JSX.Element`): An optional fallback element to display if the `each` array is empty or undefined.
- **container** (`JSX.Element`): An optional container element for the items.
- **component** (`ValidComponent`): The component to be dynamically rendered. Typically `Row` or `Column`.
- **upCount** (`number`): The number of items to be initially rendered.
- **children** (`(item: T[number], index: Accessor<number>) => U`): A function that returns a JSX element for each item in the `each` array.

### Behavior

- The component dynamically updates the rendered items based on user interactions.
- If the layout is horizontal (`direction="row"`), it listens for the `onRight` event to load more items.
- If the layout is vertical, it listens for the `onDown` event to load more items.
