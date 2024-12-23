### Row and Column Components

The `Row` and `Column` components are specialized views designed for managing layouts, particularly in the context of TV apps developed with `@lightningtv/solid`. These components offer built-in navigation, focus management, and scrolling behavior.

This guide will cover the `Row` component in detail. The `Column` component functions similarly but arranges children vertically instead of horizontally.

---

### `Row` Component

#### Props

The `Row` component accepts the following props:

| **Prop**            | **Type**                       | **Description**                                             |
| ------------------- | ------------------------------ | ----------------------------------------------------------- |
| `children`          | `JSX.Element[]`                | The child elements to render inside the row.                |
| `selected`          | `number`                       | The index of the currently selected child. Defaults to `0`. |
| `onLeft`            | `() => void`                   | Callback for when the left navigation key is pressed.       |
| `onRight`           | `() => void`                   | Callback for when the right navigation key is pressed.      |
| `onFocus`           | `(event: Event) => void`       | Callback triggered when the row gains focus.                |
| `onLayout`          | `(layout: Layout) => void`     | Callback triggered during layout updates.                   |
| `onSelectedChanged` | `(index: number) => void`      | Callback triggered when the selected index changes.         |
| `style`             | `NodeStyles`                   | Custom styles to apply to the row.                          |
| `scroll`            | `'auto' \| 'always' \| 'none'` | Defines the scrolling behavior. Default is `'auto'`.        |

#### Behavior

1. **Navigation**:

   - The `Row` listens for left and right navigation events.
   - The `onLeft` and `onRight` handlers can be customized, and default navigation logic is provided via `handleNavigation`.

2. **Focus Management**:

   - Focus events are handled via the `onFocus` prop.
   - When focus changes, the row ensures that the currently selected child is highlighted and optionally scrolls into view.

3. **Scrolling**:

   - The `withScrolling` utility is used to handle scrolling behavior when the `scroll` prop is set to `'auto'` or `'always'`.

4. **Styling**:
   - The `Row` applies default styles for a horizontal layout, with gaps between children and smooth transitions for position changes.
   - Custom styles can be merged using the `style` prop, which leverages the `combineStyles` utility.

#### Example Usage

```tsx
import { Row } from './Row';

export const Example = () => {
  const items = ['Item 1', 'Item 2', 'Item 3'];
  const handleSelectionChange = (index: number) => {
    console.log('Selected index:', index);
  };

  return (
    <Row
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
