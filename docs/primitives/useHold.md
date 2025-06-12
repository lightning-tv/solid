# `useHold`

Creates a reactive hold gesture handler, allowing you to trigger a different behavior when an interaction (e.g. key or button press) is held beyond a specified threshold.

This is useful in scenarios like press-and-hold navigation or repeated actions after a delay.

---

### Usage

```tsx
const [holdRight, releaseRight] = useHold({
  onHold: handleHoldRight,
  onEnter: handleOnRight,
  onRelease: handleReleaseHold,
  holdThreshold: 200,
  performOnEnterImmediately: true,
});

<View onRight={holdRight} onRightRelease={releaseRight} />;
```

---

### Parameters

#### `UseHoldProps`

| Prop                        | Type         | Description                                                           | Default      |
| --------------------------- | ------------ | --------------------------------------------------------------------- | ------------ |
| `onHold`                    | `() => void` | Called once the hold threshold is exceeded.                           | **Required** |
| `onEnter`                   | `() => void` | Called on press or key entry. May be delayed depending on config.     | **Required** |
| `onRelease`                 | `() => void` | Called after a successful hold is released.                           | `undefined`  |
| `holdThreshold`             | `number`     | Time in milliseconds to wait before triggering `onHold`.              | `500`        |
| `performOnEnterImmediately` | `boolean`    | Whether `onEnter` is triggered immediately or only if released early. | `false`      |

---

### Returns

```ts
[startHold, releaseHold]: [() => boolean, () => boolean]
```

- `startHold`: Call this on a key/button press. Starts the hold timer and conditionally calls `onEnter`.
- `releaseHold`: Call this on a key/button release. Stops the timer and calls `onEnter` or `onRelease` depending on how long it was held.

---

### Behavior Summary

| Action                | Description                                                                          |
| --------------------- | ------------------------------------------------------------------------------------ |
| Press + hold          | `onEnter` (optional) → after delay → `onHold`                                        |
| Press + release early | Calls `onEnter` if not already triggered                                             |
| Press + release late  | Calls `onHold` after threshold → on release calls `onRelease`                        |
| Immediate trigger     | If `performOnEnterImmediately` is `true`, `onEnter` is fired on press before timeout |

---

### Example Integration

```tsx
const [onHoldEnter, onHoldRelease] = useHold({
  onHold: () => console.log('Held long enough'),
  onEnter: () => console.log('Entered'),
  onRelease: () => console.log('Released after hold'),
  holdThreshold: 300,
  performOnEnterImmediately: false,
});

<MyComponent onEnter={onHoldEnter} onRelease={onHoldRelease} />;
```
