## Component Lifecycle (onMount, onCleanup)

SolidJS offers two primary lifecycle hooks to manage component behavior:

-[onMount](https://www.solidjs.com/docs/latest/api#onmount): Executes a function when the component is first inserted. -[onCleanup](https://www.solidjs.com/docs/latest/api#oncleanup): Executes a function to clean up resources when the component is removed.

For detailed information, refer to the [SolidJS Lifecycle documentation](https://docs.solidjs.com/references/api-reference/lifecycles/onMount)

## Built in Events

```jsx
  onCreate: (this: ElementNode, target: ElementNode)
  onDestroy: (this: ElementNode, target: ElementNode) => Promise<any> | void;
  onLayout: (this: ElementNode, target: ElementNode, child?: ElementNode, dimensions?: Dimensions)
```

Learn more about using [onDestroy](/flow/ondestroy)
Learn more about the [layout events](/flow/layout?id=layout-callbacks)

## Renderer Events

In addition to the Lifecycle events from SolidJS, the Lightning Renderer offers additional events for you to tie into using `onEvents` array:

```jsx
<View onEvents={[
  ['loaded', (element, eventInfo) => { console.log('load was called')}],
  ['failed', (element, eventInfo) => { console.log('fail was called')}]
]}>
```

Additional events from renderer are: `outOfBounds`, `inBounds`, `outOfViewPort`, `inViewPort`
