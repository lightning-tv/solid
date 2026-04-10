# States

In your application, components can exhibit various states, similar to how a button might be enabled, disabled, or focused. These states enable components to dynamically apply different styles, enhancing their visual representation and behavior based on user interaction or application logic.

States are applied from the style object with a matching name and must be prefixed with `$`:

```jsx
const Button = {
  width: 386,
  height: 136,
  color: 0x546160ff,
  alpha: 0.8,
  scale: 1,
  $focus: {
    color: 0x58807dff,
    scale: 1.1,
    alpha: 1,
  },
  $disabled: {
    color: 0x333333ff,
  },
};
```

When `Button` is focused via the [useFocusManager](/primitives/useFocusManager.md), the `$focus` state will be added to the button, causing the focus styles to be applied. And when focus is removed, the original styles on the element will be set.

> Be sure to set defaults on the original styles if applying a new style via state. Example: clipping: false, focus: { clipping: true }

States can be added to components declaratively:

```jsx
<Button states={{ $active: true, $happy: false, $disabled: false }}>Movies</Button>
<Button states={'$active'}>Sports</Button>
<Button states='$happy'>News</Button>
```

Or imperatively:

```jsx
let myButton;

createEffect(() => {
  myButton.states.add('$focus');

  // Check for a state
  if (myButton.states.has('$focus')) {
    myButton.states.remove('$focus');
  }

  myButton.states.add('$disabled');
  // is and has are identical
  myButton.states.is('$disabled');

  // toggle disabled on / off
  myButton.states.toggle('$disabled');
});
<View ref={myButton} style={Button} />;
```

Note: states always use the values in the style object. If you have a button with a base color, and a disabled and focus state which both change the color, the value applied to the button will be determined from the style object. You won't be able to set the color of the button on the JSX `<Button color={???}>` because as the states change, we need to determine which color to apply. If you need this functionality, you should pass in the color to the style object.

## The `theme` Property

To solve the issue mentioned above where setting a custom dynamic property on the JSX is immediately overridden when component states are removed or cleared, you can use the `theme` property:

```jsx
<Button theme={{ color: 0xff0000ff }} states={{ $focus: true }} />
```

Properties defined in the `theme` object act as the baseline values for your component. When rendering initially, those properties are automatically applied to the element. Later, when an active state (e.g. `$focus`) drops, the engine will deterministically look for the fallback value in the `theme` object first, before falling back to the generic `style` object. This allows developers to pass explicit, robust baseline props without state transitions using defaults from style objects.

## stateOrder

When multiple states are active on an element, the order in which they are applied is determined by the `Config.stateOrder` property. This allows you to control which state has higher specificity and overrides styles from other active states.

States defined in the `stateOrder` array have higher specificity than states not in the array. Within the `stateOrder` array, states at the end have higher specificity than those at the beginning.

```javascript
import { Config } from '@lightningtv/solid';

Config.stateOrder = ['$disabled', '$active', '$focus'];
```

In the example above:

1. `$focus` has higher specificity than `$active`.
2. `$active` has higher specificity than `$disabled`.
3. All three have higher specificity than any state NOT in the `stateOrder` list (like `$hover`).

If an element is both focused and active, the `$focus` styles will take precedence over `$active` styles for any overlapping properties. Similarly, if `$hover` is also active, both `$focus` and `$active` will override its styles.

You can also override the global `stateOrder` on a per-element basis by using the `stateOrder` attribute:

```jsx
<View stateOrder={['$active', '$focus']}>...</View>
```

This is useful if you have a specific component that needs a different specificity than the rest of the application.

## forwardStates

When you want the state to also be applied to children elements, you can add the `forwardStates` attribute to the parent element. Any states set on the parent will be added/removed from the children as well. This is useful for functional components where you need to change styles of children as well.

```jsx
function Button(props) {
  const ButtonContainer = {
    width: 386,
    height: 136,
    color: 0x000000ff,
    alpha: 0.3,
    scale: 1,
    transition: {
      scale: { duration: 1500, delay: 200, easing: 'easy-in' },
      alpha: { duration: 1500, delay: 200, easing: 'easy-in' },
    },
    $focus: {
      color: [0x58807dff, { duration: 2000 }],
      scale: 1.2,
      alpha: 1,
    },
  };

  const ButtonText = {
    fontSize: 32,
    lineHeight: Button.height,
    contain: 'width',
    textAlign: 'center',
    mountY: -0.35,
    color: 0xf6f6f9ff,
    height: Button.height,
    width: Button.width,
    $focus: {
      color: 0xffffffff,
    },
  };

  return (
    <View {...props} forwardStates style={ButtonContainer}>
      <Text style={ButtonText}>{props.children}</Text>
    </View>
  );
}
```
