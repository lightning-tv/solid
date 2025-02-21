# Focus Stack Utility

## Overview

The Focus Stack Utility helps manage focus navigation by storing and restoring focused elements in a stack. This is useful for handling focus transitions in UI navigation.

## Usage

### Importing and Setup

```tsx
import {
  FocusStackProvider,
  useFocusStack,
} from '@lightningtv/solid/primitives';
```

Wrap your application in the `FocusStackProvider` to provide focus management:

```tsx
<FocusStackProvider>
  <App />
</FocusStackProvider>
```

### Storing and Restoring Focus

In your Pages and components:

```tsx
const { storeFocus, restoreFocus, clearFocusStack } = useFocusStack();

function handleFocus(element) {
  storeFocus(element);
}

function handleBack() {
  if (!restoreFocus()) {
    console.log('No previous focus to restore');
  }
}

function resetFocusStack() {
  clearFocusStack();
}
```

## API

### `storeFocus(element: ElementNode, prevElement?: ElementNode)`

Stores the currently focused element. If the element is already active, it does nothing. You can attach storeFocus to an `onFocus` or `onBlur` handler directly.

### `restoreFocus(): boolean`

Restores focus to the last stored element and removes it from the stack.

- Returns `true` if focus was successfully restored, otherwise `false`.

### `clearFocusStack()`

Empties the focus stack, removing all stored elements.

## Example

```tsx
function MyComponent() {
  const { storeFocus, restoreFocus, clearFocusStack } = useFocusStack();

  return (
    <View>
      <LeftNav onFocus={storeFocus} />
      <Button onClick={restoreFocus}>Restore Focus</Button>
    </View>
  );
}
```
