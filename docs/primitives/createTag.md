# createTag

`createTag` is a primitive that allows you to render a Lightning node structure into a texture using the RTT (Render To Texture) feature. This is useful for creating complex UI elements that are static or updated infrequently, improving performance by reducing the number of active nodes in the render tree. The resulting tag can be used as a component multiple times.

## Usage

```tsx
import { createTag, View, Text } from '@lightningtv/solid';
import { onCleanup } from 'solid-js';

const App = () => {
  const DramaTag = createTag(
    <View color={'#ff0000ff'} borderRadius={8} display="flex" padding={8}>
      <Text style={watchIconTextStyle}>Drama</Text>
    </View>,
  );

  const NewEpisodeTag = createTag(
    <View
      color={'#fff'}
      borderRadius={8}
      display="flex"
      padding={8}
      effects={{ rounded: { radius: [10, 0, 10, 0] } }}
    >
      <Text style={watchIconTextStyle} color={'#000'} fontWeight={400}>
        New Episode
      </Text>
    </View>,
  );

  onCleanup(() => {
    DramaTag.destroy();
    NewEpisodeTag.destroy();
  });

  return (
    <View
      x={150}
      y={200}
      display="flex"
      flexDirection="row"
      gap={16}
      flexWrap="wrap"
      autofocus
    >
      <DramaTag />
      <NewEpisodeTag />
    </View>
  );
};
```

## API

### `createTag(children: JSX.Element): Component & { destroy: () => void }`

Creates a tag component from the provided children.

- **Parameters**:

  - `children`: The SolidJS/Lightning elements to render into the texture.

- **Returns**:
  - A SolidJS component that renders the generated texture.
  - The component has a static `destroy()` method.

### `TagComponent.destroy()`

Frees the texture memory associated with the tag. It is important to call this when the tag is no longer needed to prevent memory leaks, typically inside an `onCleanup` block or when the parent component unmounts.
