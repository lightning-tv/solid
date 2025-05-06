### Row and Column Components

The `Row` and `Column` components are specialized views designed for managing layouts, particularly in the context of TV apps developed with `@lightningtv/solid`. These components offer built-in navigation, focus management, and scrolling behavior.

This guide will cover the `Row` component in detail. The `Column` component functions similarly but arranges children vertically instead of horizontally.

---

### `Row` and `Column` Component

#### Props

The components accept the following props:

| **Prop**            | **Type**                                                                     | **Description**                                             |
| ------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `children`          | `JSX.Element[]`                                                              | The child elements to render inside the row.                |
| `selected`          | `number`                                                                     | The index of the currently selected child. Defaults to `0`. |
| `onLeft`            | `() => void`                                                                 | Callback for when the left navigation key is pressed.       |
| `onRight`           | `() => void`                                                                 | Callback for when the right navigation key is pressed.      |
| `onUp`              | `() => void`                                                                 | Callback for when the up navigation key is pressed.         |
| `onDown`            | `() => void`                                                                 | Callback for when the down navigation key is pressed.       |
| `onFocus`           | `(event: Event) => void`                                                     | Callback triggered when the row gains focus.                |
| `onLayout`          | `(layout: Layout) => void`                                                   | Callback triggered during layout updates.                   |
| `onSelectedChanged` | `(index: number, self: this, active: boolean, lastSelected: number) => void` | Callback triggered when the selected index changes.         |
| `onScrolled`        | `(elm: this, offset: number, isInitialPos: boolean) => void`                 | Callback triggered before scrolling occurs                  |
| `style`             | `NodeStyles`                                                                 | Custom styles to apply to the row.                          |
| `scroll`            | `'auto' \| 'always' \| 'edge' \| 'center' \| 'none'`                         | Defines the scrolling behavior. Default is `'auto'`.        |

#### Behavior

1. **Navigation**:

   - The `Row` listens for left and right navigation events.
   - The `Column` listens for up and down navigation events.
   - The `onLeft` and `onRight` handlers can be customized, and default navigation logic is provided via `handleNavigation`.

2. **Focus Management**:

   - Focus events are handled via the `onFocus` prop.
   - When focus changes, the row ensures that the currently selected child is highlighted and optionally scrolls into view.

3. **Scrolling**:

   - The `withScrolling` utility is used to handle scrolling behavior when the `scroll` prop is set to `'auto'` or `'always'`.

4. **Styling**:
   - The `Row` applies default styles for a horizontal layout, with gaps between children and smooth transitions for position changes.
   - Custom styles can be merged using the `style` prop, which leverages the `combineStyles` utility.

### scrollToIndex

You can also `scrollToIndex` by using a ref to a Row or Column, simply `myRow.scrollToIndex(3)`

#### Example Usage

```tsx
import { Row } from './Row';

export const Example = () => {
  const items = ['Item 1', 'Item 2', 'Item 3'];
  let myRow;
  const handleSelectionChange = (index: number) => {
    console.log('Selected index:', index);
  };

  setTimeout(() => {
    myRow.scrollToIndex(2);
  }, 100);

  return (
    <Row
      ref={myRow}
      selected={0}
      onSelectedChanged={handleSelectionChange}
      scroll="auto"
      style={{ gap: 40 }}
    >
      {items.map((item) => (
        <div>{item}</div>
      ))}
    </Row>
  );
};
```

---

- Default styles for the `Row` include a `flex` layout with a gap of `30px` and transitions. You can disable `flex` by setting `display={'block'}` on the `Row`. Additionally you can use skipItem on a child to not focus it.
