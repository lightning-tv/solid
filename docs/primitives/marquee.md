# `Marquee`

A wrapper component around `MarqueeText` that accepts standard `view` layout props and `TextProps`, managing `clipWidth` automatically via layout.

### Usage

```tsx
<Marquee
  width={400}
  marquee={inFocus()}
  easing="ease-in-out"
  textProps={{
    fontSize: 28,
  }}
>
  This is a long text that will scroll when it overflows the container.
</Marquee>
```

### Props

Extends all standard [`NodeProps`](/solid/#/primitives/view) (excluding `children`), plus:

| Prop        | Type               | Description                                                 | Default       |
| ----------- | ------------------ | ----------------------------------------------------------- | ------------- |
| `children`  | `string \| number` | The text to display.                                        | **Required**  |
| `marquee`   | `boolean`          | Whether to scroll or statically contain the text.           | `false`       |
| `speed`     | `number`           | Scroll speed in pixels per second.                          | `200`         |
| `delay`     | `number`           | Delay between scroll loops in milliseconds.                 | `1000`        |
| `scrollGap` | `number`           | Gap between scroll loops in pixels.                         | `0.5 * width` |
| `easing`    | `string`           | CSS-compatible easing function for the scroll animation.    | `'linear'`    |
| `textProps` | `TextProps`        | Additional props to pass to the internal `<text>` elements. | `{}`          |

### Notes

- Computes `clipWidth` and `clipHeight` based on layout and `textProps`.
- Automatically sets `clipping={true}` when `marquee` is enabled.
- Intended for simple marquee use cases without manually managing layout or `clipWidth`.

---

# `MarqueeText`

Displays a single-line text that scrolls when its content overflows the visible width.

When the `marquee` prop is `true` and the text exceeds the `clipWidth`, `MarqueeText` duplicates the content and scrolls it from right to left in a seamless loop. Otherwise, it shows the text statically.

### Usage

```tsx
<view width={400} height={28} clipping>
  <MarqueeText
    clipWidth={400}
    marquee={inFocus()}
    speed={200}
    delay={1000}
    scrollGap={24}
    easing="ease-in-out"
  >
    This is a long text that will scroll when it overflows the container.
  </MarqueeText>
</view>
```

### Props

Extends [`TextProps`](/solid/#/elements/text), with the following additions:

| Prop        | Type      | Description                                                              | Default           |
| ----------- | --------- | ------------------------------------------------------------------------ | ----------------- |
| `clipWidth` | `number`  | Width of the visible container in pixels.                                | **Required**      |
| `marquee`   | `boolean` | Whether to scroll or display the text statically.                        | `false`           |
| `speed`     | `number`  | Speed of the scroll animation in pixels per second.                      | `200`             |
| `delay`     | `number`  | Time in milliseconds to wait before starting each animation cycle.       | `1000`            |
| `scrollGap` | `number`  | Space between the end of one scroll cycle and the beginning of the next. | `0.5 * clipWidth` |
| `easing`    | `string`  | Easing function for the animation (e.g. `linear`, `ease-in-out`).        | `'linear'`        |

### Notes

- Automatically hides itself if the text fits within the `clipWidth`.
- Uses double `<text>` elements to create a seamless scroll.
- Ensures animation stops when the component unmounts.
