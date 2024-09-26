# Element Node

All JSX code is compiled into `ElementNode` class objects, which extend the Lightning 3 Renderer nodes.

![Solid to Renderer Nodes](images/SolidElementNode.jpg)

```jsx
let container;
<View ref={container} width={300} height={100}>
  <View width={100} height={100} color={'#FF0000'} />;
  <View width={100} height={100} color={'#00FF00'} />;
  <View width={100} height={100} color={'#0000FF'} />;
</View>;
```

The above code creates an `ElementNode` with 3 children `ElementNode`s. By using Solid's `ref`, we gain direct access to the underlying node instance, allowing us to control the renderer directly.

```js
// You can set any properties directly via the ref
container.width = 500;
container.color = '#000000';
container.x = 100;
// ElementNode extends Object, so you can add arbitrary properties.
// Only renderer-specific properties will be forwarded
container.customProp = 'Solid Rocks';
```

Often, you'll want to manipulate the children of the node.

```js
container.children.forEach((child) => {
  // Each child is also an ElementNode
  child.x += 100;

  // or animate properties
  child.animate({ alpha: 1, scale: 1.1 }, { duration: 500 }).start();
});
```

## Understanding Row / Column-like Elements

Continuing with our example, let's add focus management with keypress handling (assuming [useFocusManager](../primitives/useFocusManager.md) is enabled).

```jsx
let container;

// Full keyhandler typedef, you might not need all the arguments
function moveLeft(this: ElementNode, e: KeyboardEvent, container: ElementNode, focusedNode: ElementNode) {
  // Move focus to the left
  if (container.selected > 0) {
    container.selected--;
    container.children[container.selected].setFocus();
  }
}

function moveRight(this: ElementNode, e: KeyboardEvent, container: ElementNode, focusedNode: ElementNode) {
  // Move focus to the right
  if (container.selected < container.children.length - 1) {
    container.selected++;
    container.children[container.selected].setFocus();
  }
}

<View
  ref={container}
  width={300}
  height={100}
  onLeft={moveLeft}
  onRight={moveRight}
  selected={0}
>
  <View width={100} height={100} color={'#FF0000'} autofocus />;
  <View width={100} height={100} color={'#00FF00'} />;
  <View width={100} height={100} color={'#0000FF'} />;
</View>;
```

In the `moveLeft` and `moveRight` functions, we manually update the `selected` property, which tracks the focused child element. The `setFocus` method is used to apply focus to the newly selected child.

### Styling Focused Blocks

To complete this example, we can style the blocks based on their focus state. Let's add some styling for focus:

```jsx
const blockStyle = {
  width: 100,
  height: 100,
  alpha: 0.3, // Default opacity
  focus: {
    alpha: 1, // Full opacity when focused
  },
  transition: {
    alpha: true, // Enable smooth transition for alpha
  },
};

<View
  ref={container}
  width={300}
  height={100}
  onLeft={moveLeft}
  onRight={moveRight}
  selected={0}
>
  <View style={blockStyle} color={'#FF0000'} autofocus />;
  <View style={blockStyle} color={'#00FF00'} />;
  <View style={blockStyle} color={'#0000FF'} />;
</View>;
```

Now, when a block gains focus, its `alpha` value will animate smoothly from 0.3 to 1. Read more about [states](./states.md).
