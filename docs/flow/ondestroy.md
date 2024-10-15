# `onDestroy` Lifecycle Hook

`onDestroy` is a hook that triggers when an element is about to be removed from the canvas. It gives developers an opportunity to perform exit animations before the element is destroyed.

Check out the full working example: https://lightning-tv.github.io/solid-demo-app/#/destroy

## Example

In the following example, `onDestroy` is used to animate the `Hero` component out of view before it is replaced with new content.

```jsx
function animateIn(node) {
  node.alpha = 0;
  node.y = -100;
  return node
    .animate({ y: 0, alpha: 1 }, { duration: 500, easing: 'ease-in-out' })
    .start()
    .waitUntilStopped();
}

function animateOut(node) {
  return node
    .animate({ y: 200, alpha: 0 }, { duration: 500, easing: 'ease-in-out' })
    .start()
    .waitUntilStopped();
}

<Show when={heroContent()} keyed>
  <Hero
    id="Hero"
    autofocus
    onDestroy={animateOut}
    onCreate={animateIn}
    src={heroContent().src}
    backdrop={heroContent().backdrop}
    title={heroContent().title}
    overview={heroContent().overview}
  />
</Show>;
```

### How It Works

- **`keyed` Attribute**: The `keyed` attribute on the `<Show>` component forces Solid to destroy the old component and create a new one whenever the hero content changes. This ensures that each `Hero` component is uniquely identified and allows for animations to be applied during transitions.
- **Exit Animation**: The existing node’s `onDestroy` hook triggers `animateOut`, which returns a promise. This promise is important because Solid waits for it to resolve before actually removing the element from the DOM, ensuring the exit animation completes.
- **Entrance Animation**: The new `Hero` component is animated into view using the `onCreate` hook. This is where `animateIn` gradually brings the new hero content into the UI.

Together, these lifecycle hooks allow smooth transitions and animations when switching between content, enhancing the user experience.
