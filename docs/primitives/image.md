# `Image`

A component for displaying images that gracefully handles loading, placeholder, and fallback states. This has a bit of overhead so only use when you have placeholder image as well. Otherwise simple use a `<View src={someImage} />`

### Usage

```tsx
<Image
  src="path/to/image.png"
  placeholder="path/to/placeholder.png"
  fallback="path/to/fallback.png"
  width={185}
  height={320}
/>
```

### Props

Extends all standard `NodeProps`, plus:

| Prop          | Type     | Description                                         | Default      |
| ------------- | -------- | --------------------------------------------------- | ------------ |
| `src`         | `string` | The URL of the image to display.                    | **Required** |
| `placeholder` | `string` | The URL of an image to show while `src` is loading. | `undefined`  |
| `fallback`    | `string` | The URL of an image to show if `src` fails to load. | `undefined`  |

### Notes

- If `placeholder` is provided, it will be displayed initially.
- Once the `src` image loads successfully, it will replace the `placeholder`.
- If the `src` image fails to load and a `fallback` is provided, the fallback image will be displayed, otherwise the `placeholder` will remain.
