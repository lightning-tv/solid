# Transitions / Animations

Transitions allow you to change properties smoothly over time. You can define which properties will animate via the `transition` property along with setting custom `animationSettings`. If you wish to reuse or use the default `animationSettings`, you can set the property value to `true`.

```jsx
createEffect(on(activeElement, (elm) => {
    focusRingRef.x = elm.x;
}, { defer: true}))

<FocusRing ref={focusRingRef} transition={{ x: true, scale: { duration: 1500, easing: 'ease-in-out'} }} />
```

Transition can also be set in the style object and you have control over multiple properties:

```jsx
const buttonStyle = {
  ...
  transition: {
    scale: { duration: 200, easing: 'ease-out'},
    alpha: { duration: 200, easing: 'ease-out'}
  }
}
```

Additionally, if you want all properties to transition you can set `transition: true` and an `animationSettings` property on the component to use for all transitions.

## Direct Animations

For more complicated animations, you can access the Lightning renderer animate API directly:

```jsx
let button;

onMount(() => {
  button.animate({ alpha: 1, scale: 1.1 }, { duration: 500 }).start();
});
<Button ref={button}>Movies</Button>;
```

To find out more about animations check out the [renderer example](https://github.com/lightning-js/renderer/blob/main/examples/tests/animation.ts#L70).

You can also chain animations with

```js
sprite
  .chain({ x: 50, y: 100 }, { duration: 100 })
  .chain({ x: 250, y: 200 }, { duration: 200 })
  .chain({ x: 50, y: 100 }) // will use { duration: 200 }
  .chain({ x: 250, y: 200 }, { duration: 100 })
  .start();
```

If you don't pass in animation settings as the second argument, it will default to the previously passed in value.

## Default Animation Settings

You can set default animation settings for all transitions globally via Config.

```js
import { Config } from '@lightningtv/solid';
Config.animationSettings = {
  duration: 250,
  delay: 0,
  repeat: 0,
  loop: false,
  stopMethod: false,
  easing: 'ease-in-out',
};
```

## Disabling Animations for low end devices

You can disable all transitions with `Config.animationsEnabled = false`. This will not disable calls directly to `.animate`.

## Bypassing Transitions

In the event you want to bypass a style transition you can do the following:

```jsx
let button;

onMount(() => {
  // lng is the lightning node and will bypass transition property
  button.lng.alpha = 0.5;
});
<Button ref={button}>Movies</Button>;
```

Additionally if you have new page loads and won't to skip any animations you can do

```js
Config.animationsEnabled = false;

onMount(() => {
  // Or set this back after your data loads and things are rendered
  Config.animationsEnabled = true;
});
```

## Animation Callbacks `onAnimation`

The `onAnimation` callback is triggered during various stages of an animation. If you have defined a function for this callback, it will be automatically called during these specific animation events: `'animating'`, `'tick'`, or `'stopped'`.

#### Available Events:

- **`animating`**: Triggered when the animation starts.
- **`tick`**: Triggered at each tick or frame update of the animation, passes in the progress.
- **`stopped`**: Triggered when the animation stops.

Each of these events can have its own handler function.

#### Event Handler Parameters:

- **`this`**: The `ElementNode` on which the animation event is being handled.
- **`controller`**: The animation controller object handling the current animation.
- **`name`**: The name of the animation being executed.
- **`endValue`**: The final value associated with the animation (or the current value for events like `tick`).
- **`props`** (optional): Additional properties or configuration passed to the animation.

#### Example Usage:

```js
onAnimation: {
  animating: (controller, name, endValue, props) => {
    console.log(`Animation ${name} is animating`);
  },
  tick: (controller, name, endValue, props) => {
    console.log(`Animation ${name} tick at value: ${endValue}`);
  },
  stopped: (controller, name, endValue, props) => {
    console.log(`Animation ${name} stopped`);
  },
}
```

In this example:

- The `animating` event is triggered when the animation starts running.
- The `tick` event is fired on every frame or update cycle.
- The `stopped` event fires when the animation ends.
