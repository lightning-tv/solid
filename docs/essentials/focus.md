# Focus / Key Handling (or Remotes)

Focus happens very differently than you're used to with HTML / CSS. Since everything happens in a Canvas tag - we mimic focus with a bit of Javascript logic, starting with the `activeElement`

## `activeElement`

At any time, only one element can have focus: the `activeElement`. `activeElement` is a global Solid signal that points to the element with focus. You can set focus on any element by adding an `autofocus` attribute or imperatively with `elm.setFocus()` method. However, calling setFocus on each element would be painful, so you'd want to use components like Row and Column from [solid-ui](https://github.com/rdkcentral/solid-ui).

## Keyhandling with useFocusManager

Keyhandling is added with [useFocusManager](/primitives/useFocusManager.md). It's important to note that keyhandling simply add onKey handling. The real magic is from Row & Column components having built in onRight / onLeft & onUp / onDown key handlers respectively, which simply changes the `activeElement` of it's children.

## `autofocus`

The `autofocus` attribute can be added to any element to give it focus when created. Ideally, you'd have one element you'd want to receive focus when page changes occur, or new elements are added. The `autofocus` attribute can also take a signal which will cause the element to refocus when the signal changes. This is useful for dynamic data loading and needing to reset focus on a Row or Column component.

## `skipFocus`

Adding `skipFocus` to any element will prevent it from receiving focus. This is primarily used by Row & Column components to have children which should be skipped on key presses.

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

## Debugging Focus

You can set

```js
Config.focusDebug = true;
Config.rendererOptions.enableInspector = true;
```

To enable focus debugging. This will add a border around the activeElement and additional borders up the focusPath. You'll also need to be using the useFocusManager.
