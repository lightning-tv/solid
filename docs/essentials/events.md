## Component Lifecycle (onMount, onCleanup)

SolidJS offers two primary lifecycle hooks to manage component behavior:

- **[onMount](https://www.solidjs.com/docs/latest/api#onmount)**: Executes a function when the component is first inserted.
- **[onCleanup](https://www.solidjs.com/docs/latest/api#oncleanup)**: Executes a function to clean up resources when the component is removed.

For detailed information, refer to the [SolidJS Lifecycle documentation](https://docs.solidjs.com/references/api-reference/lifecycles/onMount).

## Built-in Events

The SolidJS integration provides built-in events that can be utilized within your components:

```jsx
  onCreate: (this: ElementNode, target: ElementNode);
  onDestroy: (this: ElementNode, target: ElementNode) => Promise<any> | void;
  onLayout: (this: ElementNode, target: ElementNode, child?: ElementNode, dimensions?: Dimensions);
```

Learn more about using [onDestroy](/flow/ondestroy) and the [layout events](/flow/layout?id=layout-callbacks).

## Renderer Events

In addition to the lifecycle events from SolidJS, the Lightning Renderer offers additional custom events for you to tie into using the `onEvent` object. These events provide information about element visibility and state within the renderer.

### Example Usage:

```jsx
<View
  onEvent={{
    loaded: (element, eventInfo) => {
      console.log('load was called');
    },
    failed: (element, eventInfo) => {
      console.log('fail was called');
    },
    inBounds: (element, eventInfo) => {
      console.log('Element entered bounds');
    },
    outOfBounds: (element, eventInfo) => {
      console.log('Element exited bounds');
    },
    inViewport: (element, eventInfo) => {
      console.log('Element entered viewport');
    },
    outOfViewport: (element, eventInfo) => {
      console.log('Element exited viewport');
    },
  }}
/>
```

### Available Renderer Events:

- **`loaded`**: Fired when the element has successfully loaded.
- **`failed`**: Fired when the element fails to load.
- **`freed`**: Fired when the element is freed for memory.
- **`inBounds`**: Fired when the element enters the bounds of the visible screen area.
- **`outOfBounds`**: Fired when the element leaves the visible screen area.
- **`inViewport`**: Fired when the element enters the viewport (the portion of the screen where content is visible).
- **`outOfViewport`**: Fired when the element leaves the viewport.

These additional events provide control over element state and position within the Lightning Renderer, allowing you to react to changes such as visibility or load state with custom logic.

## Emitting Custom Events with `emit`

In addition to handling events, components can trigger their own custom events using the `emit` method. This method allows components to communicate with their ancestors by dispatching an event up the hierarchy.

### Usage Example:

```jsx
nodeRef.emit('customEvent', { message: 'Hello, world!' });
// function triggerCallback(this: MyComponent, nodeRef, payload) {

<MyComponent onCustomEvent={triggerCallback} />;
```

### How `emit` Works:

1. It starts at the current component and looks for a handler named `onCustomEvent` (where `CustomEvent` is capitalized).
2. If a handler exists and returns `true`, the event stops propagating.
3. Otherwise, it continues up the component tree until it reaches the root or finds a handler that returns `true`.
