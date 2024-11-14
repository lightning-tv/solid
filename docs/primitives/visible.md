## `Visible` Component

The `Visible` component in SolidJS provides conditional rendering of its child elements based on the `when` prop. When `when` is `true`, the children are rendered and displayed; when `false`, they are hidden (alpha set to 0) from view but remain in the Lightning tree, allowing for efficient toggling of visibility unlike the `<Show>` component which destroys and recreates elements.

### Usage

### Props

- **`when`**: A `boolean` determining whether the children are visible (`true`) or hidden (`false`).
- **`children`**: The elements or components to render conditionally based on the `when` prop.

### Example

Below is an example illustrating how to use the `Visible` component to toggle the display of a message based on a button click.

```typescript
import { createSignal } from "solid-js";
import { View, Text, Visible } from "@lightningtv/solid";

function App() {
  const [isVisible, setIsVisible] = createSignal(false);

  return (
    <View>
      <View autofocus onEnter={() => setIsVisible((prev) => !prev)}>
        Toggle Visibility
      </View>
      <Visible when={isVisible()}>
        <Text>This message is conditionally visible.</Text>
      </Visible>
    </View>
  );
}

export default App;
```

In this example:

- onEnter "Toggle Visibility" updates the `isVisible` signal.
- The `Visible` component toggles the visibility of the `<Text>`.

### Key Points

- **Visibility Control**: Unlike Solid's native conditional rendering (`<Show>` or `{ condition && <Component /> }`), `Visible` maintains child elements in, making it ideal for scenarios where you need to preserve element state or animations while toggling visibility.
- **Efficiency**: By avoiding remounting, `Visible` can improve performance in scenarios with complex children that should remain in memory when hidden.
