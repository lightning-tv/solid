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
  // rootNode and throttleBy in ms
  useMouse(undefined, 100);

  // Additional application logic...
};
```
