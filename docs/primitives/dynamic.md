## Dynamic

`Dynamic` is a component that lets you insert an arbitrary Component or tag and passes the props through to it. Useful when you have multiple types of components that you dynamically want to render on the screen.

### Example

To use the `Dynamic` component:

```javascript
import { Dynamic } from '@lightningtv/solid';
import { Poster, Hero, PosterTitle } from './components';
const typeToComponent = {
  Poster: Poster,
  Hero: Hero,
  PosterTitle: PosterTitle,
};

<Row y={46} height={props.height}>
  <For each={props.items}>
    {(item) => (
      <Dynamic component={typeToComponent[props.row.type]} {...item} />
    )}
  </For>
</Row>;
```

### Props

- **component** (`ValidComponent`): The component to be dynamically rendered.

Any other props set on Dynamic are passed through to the component.
