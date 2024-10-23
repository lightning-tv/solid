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

In addition to the lifecycle events from SolidJS, the Lightning Renderer offers additional custom events for you to tie into using the `onEvents` object. These events provide information about element visibility and state within the renderer.

### Example Usage:

```jsx
<View
  onEvents={{
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
- **`freed`**: Fired when the element freed for memory.
- **`inBounds`**: Fired when the element enters the bounds of the visible screen area.
- **`outOfBounds`**: Fired when the element leaves the visible screen area.
- **`inViewport`**: Fired when the element enters the viewport (the portion of the screen where content is visible).
- **`outOfViewport`**: Fired when the element leaves the viewport.

These additional events provide control over element state and position within the Lightning Renderer, allowing you to react to changes such as visibility or load state with custom logic.
