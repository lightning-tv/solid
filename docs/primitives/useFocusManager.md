# useFocusManager for Key Handling

The `useFocusManager` primitive is designed to handle user input, manage focus paths, and trigger focus and blur events on components. This primitive is set up once during app initialization and provides key handling capabilities.

## Usage

### Import and Setup

Import the `useFocusManager` and configure it with your custom key mappings:

```jsx
import { useFocusManager } from '@lightningtv/solid';

const App = () => {
  const focusPath = useFocusManager({
    Left: ['ArrowLeft', 37],
    Right: ['ArrowRight', 39],
    Up: ['ArrowUp', 38],
    Down: ['ArrowDown', 40],
    Enter: 'Enter',
    Last: 'l',
  });

  // Additional application logic...
};
```

### Focus Path Tracking

The `useFocusManager` returns a signal, `focusPath`, which is an array of elements that currently have focus. When the `activeElement` changes, the focus path is recalculated. During this process:

- All elements in focus will have a `focus` state added, and `onFocus(currentFocusedElm, prevFocusedElm)` event is called.
- Elements losing focus will have the `focus` state removed, and `onBlur(currentFocusedElm, prevFocusedElm)` event is called.

### Key Handling

When a key is pressed:

1. The `keyMap` looks for the key name and its corresponding value.
2. It calls the `on${key}` handler first.
3. If the key is not handled, it calls the generic `onKeyPress` on the active element and then propagates up through the focus path until the key press is handled.

The keyHandler signature is: `(this: ElementNode, e: Event, elm: ElementNode, finalFocusedElm) => boolean`

To stop the propagation of a key press, the handler must return `true`. Any other return value or no return value will continue to propagate the key press through the focus path, looking for additional handlers.

### Custom Key Mappings

You can pass in an array of keys for a single event. The custom keys object will be merged with the default key mapping:

```js
const defaultKeyMap = {
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  Enter: 'Enter',
  ' ': 'Space',
  Backspace: 'Back',
  Escape: 'Escape',
  37: 'Left',
  39: 'Right',
  38: 'Up',
  40: 'Down',
  13: 'Enter',
  32: 'Space',
  8: 'Back',
  27: 'Escape',
};
```

### Example

Here's a complete example of how to use `useFocusManager`:

```jsx
import { createSignal } from 'solid-js';
import { useFocusManager } from '@lightningtv/solid';
import { Button } from '@lightningjs/solid-ui';

const App = () => {
  const focusPath = useFocusManager({
    Left: ['ArrowLeft', 37],
    Right: ['ArrowRight', 39],
    Up: ['ArrowUp', 38],
    Down: ['ArrowDown', 40],
    Enter: 'Enter',
    Last: 'l',
  });

  return (
    <View>
      <Button onEnter={() => console.log('Enter pressed')}>Button 1</Button>
      {/* More components... */}
    </View>
  );
};

export default App;
```

In this example, buttons will handle the `Enter` key press and log a message to the console. Adjust the key mappings and handlers as needed for your application.
