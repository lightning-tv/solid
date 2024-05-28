# Components

There are two building blocks provided by Solid Lightning: **View** & **Text**

## Creating a Counter Component

The following code demonstrates how to create a simple Counter component using SolidJS and Lightning TV. This component displays a text element with custom styles.

### Imports and Typescript

First, necessary functions and types are imported from `solid-js` and `@lightningtv/solid`:

```jsx
import { type Component } from 'solid-js';
import { View, Text, type NodeProps } from '@lightningtv/solid';
```

### Component Interface

An interface `CounterProps` is defined, extending `NodeProps` and you can define your properties to be passed into the component:

```jsx
interface CounterProps extends NodeProps {
  count: number
}
```

### Counter Component

The `Counter` component is defined as a SolidJS component that accepts `CounterProps`:

```jsx
import { type Component } from 'solid-js';
import { View, Text, type NodeProps } from '@lightningtv/solid';

interface CounterProps extends NodeProps {
  count: number;
}

const styles = {
  Container: {
    width: 300
  },
  Text: {
    fontSize: 24,
    contain: 'width'
  }
} as const;

const Counter: Component<CounterProps> = props => {
  return (
    <View
      {...props}
      style={styles.Container}
    >
      <Text style={styles.Text}>{props.count}</Text>
    </View>
  );
};
```

You'll notice we separated our styles from the component to make them reusable and also remove some of the noise on the component. The `style` prop takes an object and spreads the object onto the component. You'll learn more about [styling](/styling.md) later on.

## Using Counter

```jsx
import Counter from './path/to/Counter';

function App() {
  return <Counter>4</Counter>;
}
```

To learn more about creating components read the [SolidJS documentation](https://docs.solidjs.com/guides/foundations/understanding-components). You'll do the same authoring of components that you learn from the Solid docs. For example, lets use a signal to pass into Counter.

```jsx
import { createSignal } from 'solid-js';
import Counter from './path/to/Counter';

function App() {
  const [count, setCount] = createSignal(4);

  return <Counter>{count()}</Counter>;
}
```

## use: (Directives) in Solid

SolidJS has built in [Directives](https://www.solidjs.com/docs/latest/api#use___) support via `use:` property. These only work on root elements `node` and `text`. Meaning you can't use `View` or `Text`. Here's how to use the `withPadding` directive

```jsx
import { withPadding } from '@lightningtv/solid';
withPadding; // prevent treeshaking

<node // Use node instead of View
  use:withPadding={[10, 15]}
  {...props}
  style={{
    color: '#00000099',
    borderRadius: 8,
    border: { width: 2, color: '#ffffff' },
  }}
>
```
