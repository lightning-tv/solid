# useMouse for Mouse Handling

The `useMouse` primitive enables mouse interaction by setting the `activeElement` to any element the mouse pointer hovers over, provided the element has a `focus` state, `onFocus`, or `onEnter` property, and does not have `skipFocus` set to `true`.

Additionally, `useMouse` handles wheel scrolling. When the user scrolls with the mouse wheel, it triggers `onUp` and `onDown` events on the current `activeElement`.

This primitive should be enabled for TV's with mouse input like LG's Magic Remote.

## Usage

### Import and Setup

Import the `useMouse` and call it:

```jsx
import { useMouse } from '@lightningtv/solid';

const App = () => {
  // rootNode, throttleBy in ms, and options
  useMouse(undefined, 100, {
    customStates: {
      hoverState: '$hover',
      pressedState: '$pressed',
      pressedStateDuration: 150, // optional, default is 150ms
    },
  });

  // Additional application logic...
};
```

### Custom States

You can configure `useMouse` to apply custom states to elements when they are hovered or pressed. This is useful for styling elements based on mouse interaction.

- `hoverState`: Applied to the element currently under the mouse cursor.
- `pressedState`: Applied to the element when it is clicked.

To use this, pass the `customStates` option to `useMouse`.

### Click Handling

When an element is clicked, `useMouse` attempts to handle the interaction in the following order:

1. **`onMouseClick`**: If the element has an `onMouseClick` handler, it is called with the mouse event and the element instance.
2. **`onEnter` (with Custom States)**: If `customStates` are configured and the element has an `onEnter` handler, `onEnter` is called.
3. **Enter Key Event**: If neither of the above are handled, a global 'Enter' key event (keydown and keyup) is dispatched.

Example of handling clicks:

```jsx
const MyButton = (props) => {
  return (
    <View
      {...props}
      onMouseClick={(e, elm) => {
        console.log('Clicked!', elm);
      }}
    />
  );
};
```
