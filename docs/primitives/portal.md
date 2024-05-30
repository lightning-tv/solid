# `Portal`

The `<Portal>` component allows you to mount a component with a different parent, useful for Modals or global changes.

## Example

```jsx
import { Portal, Text } from '@lightningtv/solid';
import { GlobalHeader } from './components/globalHeader';

const App = (props) => {
  return (
    <GlobalHeader id="globalHeader">
    <Portal mount="globalHeader">
      <Text>Add some text to global header</Text>
    </Portal>
  );
};
```
