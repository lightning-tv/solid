# Shaders and Effects

The shader prop allows you to specify a custom shader. Most of the common use ones have shortcuts like `borderRadius`, `border`, `linearGradient`. These shortcuts get combined to create one dynamic shader from the Renderer. The order that they are listed in the props / style object affect how it gets created and could change the UI. Typically you want borderRadius to be the last one. If you have a custom shader, you'll need to use the `shader` prop and create the directly. Check out this [example](https://github.com/lightning-js/renderer/blob/main/examples/tests/dynamic-shader.ts) from the renderer for more information.

```jsx
const RoundedRectangle = ['RoundedRectangle', { radius: 6 }];
function Button(props) {
  return (
    <View
      {...props}
      forwardStates
      style={buttonStyles.container}
      shader={RoundedRectangle}
    >
      <View style={buttonStyles.topBar} shader={RoundedRectangle}></View>
      <Text style={buttonStyles.text}>{props.children}</Text>
    </View>
  );
}
```

## Border and borderRadius

`border` and `borderRadius` are special props which create effects for the DynamicShader found in the Lightning Renderer. These props can be set on the JSX or style object. The order in which you set the props determine how they are applied in the shader. Meaning you probably want to set borderRadius first. You can also set individual borders via `borderLeft`, `borderRight`, `borderTop`, `borderBottom`. These properties do not support animations.

```js
const style = {
  borderRadius: 30,
  border: { width: 10, color: 0x000000ff },
};

// or

const style = {
  borderLeft: { width: 10, color: 0x000000ff },
  borderRight: { width: 10, color: 0x000000ff },
};
```

## Linear Gradient & Radial Gradient

`linearGradient` and `radialGradient` are effects that can be used by setting the effects prop.

```jsx
import { deg2Rad } from '@lightningjs/renderer/utils';

<View
  effects={{
    linearGradient: {
      angle: deg2Rad(225),
      width: 300,
      height: 300,
      stops: [0.1, 0.5],
      colors: [0xff0000ff, 0x00000000],
    },
  }}
/>;
```

```jsx
<View
  width={300}
  height={300}
  effects={{
    radialGradient: {
      pivot: [225],
      width: 300,
      height: 300,
      stops: [0.1, 0.5],
      colors: [0xff0000ff, 0x00000000],
    },
  }}
/>
```

You can have as many stops or colors as you like. Please note linearGradients strongly affect performance at the moment.
