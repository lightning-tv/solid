# `<Show>` Component

SolidJS provides a [`<Show>`](https://docs.solidjs.com/reference/components/show) control component that you can use to conditionally render elements. It's important to note that `<Show>` is useful for preventing nodes from being created and will destroy them when its condition is false. In most cases, if you want the nodes to exist but just be hidden, you should use a different approach.

## Hidden (visibility)

You can use the `hidden={boolean}` attribute to hide elements from the screen. This is a shortcut for setting `alpha={hide ? 0 : 1}`. This approach keeps the node available in the renderer but not visible on the screen.
