# Focus / Key Handling (or Remotes)

## `activeElement`

At any time, only one element can have focus: the `activeElement`. `activeElement` is a global Solid signal that points to the element with focus. You can set focus on any element with `elm.setFocus()`.

### Example

```jsx
import { createEffect, on, onMount } from 'solid-js';
import { activeElement } from '@lightningtv/solid';

// Get notified whenever the activeElement changes
createEffect(
  on(
    activeElement,
    (elm) => {
      focusRingRef.x = elm.x;
    },
    { defer: true },
  ),
);

// The autofocus attribute will setActiveElement on this element when initially created
<Button autofocus>TV Shows</Button>;

let myButton;
onMount(() => {
  myButton.setFocus();
});
<Button ref={myButton}>Sports</Button>;
```

## `forwardFocus`

Sometimes an element is focused via `setFocus`, but you want a child element to receive the focus instead. In such cases, `forwardFocus={childIndexNumber}` will skip setting `activeElement` on this element and instead set focus on `this.children[childIndexNumber]`. For more complex needs, `forwardFocus` can also take a function that allows you to set focus on any element you want, or you can return `false` from the function to have the element receive focus.

### Example

```jsx
// Focus on the column but then focus on the first child
<Column autofocus forwardFocus={0}>
  // ... child elements here will receive focus
</Column>
```

The Child element can also have a `forwardFocus` attribute to keep passing focus along.

## Add Keyhandling

Keyhandling is added with [useFocusManager](/primitives/useFocusManager.md). It's important to note that keyhandling simple changes the `activeElement`.
