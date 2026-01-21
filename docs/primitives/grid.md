### Grid Component

The `Grid` component is simplified version of combining Column & Row and doesn't allow scrolling left and right offscreen.

---

### Props

| **Prop**        | **Type**                | **Description**                                                    |
| --------------- | ----------------------- | ------------------------------------------------------------------ |
| `item`          | `ValidComponent`        | The component to render for each grid item.                        |
| `itemHeight`    | `number`                | The height of each grid item.                                      |
| `itemWidth`     | `number`                | The width of each grid item.                                       |
| `itemOffset`    | `number` (optional)     | The gap between grid items. Defaults to `0`.                       |
| `items`         | `Array<{ id: string }>` | The array of items to render. Each item must have a unique `id`.   |
| `columns`       | `number` (optional)     | The number of columns in the grid. Defaults to `4`.                |
| `looping`       | `boolean` (optional)    | Enables looping navigation. Defaults to `false`.                   |
| `refocusParent` | `() => void` (optional) | A callback invoked when navigation attempts to move out of bounds. |

---

### Behavior

1. **Grid Navigation**:
   - The `Grid` supports navigation via `onUp`, `onDown`, `onLeft`, and `onRight` events.
   - Navigation is column-aware, ensuring horizontal navigation stays within the same row unless looping is enabled.

2. **Looping**:
   - When `looping` is enabled, navigation wraps around when reaching the grid boundaries.
   - For vertical navigation, reaching the last row loops to the first row and vice versa.
   - For horizontal navigation, reaching the end of a row wraps to the start of the same row.

3. **Focus Handling**:
   - The `Grid` manages focus internally using a `focusedIndex` signal.
   - The `refocusParent` callback is invoked if navigation attempts to move out of the grid's bounds (when looping is disabled).

4. **Dynamic Layouts**:
   - The grid's dimensions (item size and offsets) are calculated dynamically using the `itemWidth`, `itemHeight`, and `itemOffset` props.
   - The number of columns defaults to `4` but can be customized via the `columns` prop.

---

### Example Usage

```tsx
import { Grid } from './Grid';
import ItemComponent from './ItemComponent';

const items = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
  { id: '4', name: 'Item 4' },
  { id: '5', name: 'Item 5' },
];

export const Example = () => {
  const handleParentFocus = () => {
    console.log('Refocusing parent component');
  };

  return (
    <Grid
      item={ItemComponent}
      itemHeight={150}
      itemWidth={200}
      itemOffset={10}
      items={items}
      columns={3}
      looping={true}
      refocusParent={handleParentFocus}
    />
  );
};
```
