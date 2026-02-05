# `borderBox`

A SolidJS directive that adds a visual border component to an element when it receives focus.

### Usage

```tsx
import { borderBox } from '@lightningtv/solid/primitives';

// Simple usage
<view use:borderBox={true} />

// Usage with custom border space
<view use:borderBox={{ borderSpace: 10 }} />

// Usage with custom border color (passed via NodeProps)
<view use:borderBox={{ border: { color: 0xff0000, width: 4 } }} />
```

### Parameters

The directive accepts `BorderProps | true | undefined` as the value.

### BorderProps

Extends standard [`NodeProps`](/solid/#/primitives/view).

| Prop          | Type     | Description                                      | Default |
| ------------- | -------- | ------------------------------------------------ | ------- |
| `borderSpace` | `number` | The space between the element and the border box | `6`     |

### Default Styles

The border box uses `BorderBoxStyle` defaults:

- `borderSpace`: 6
- `borderRadius`: 20
- `border`: `{ color: 0xffffff, width: 2 }`
- `alpha`: 0 (initially, fades in to 1)

When the element gains focus, the border (a `view`) is created, inserted into the element, and `fadeIn` is called. When focus is lost, `fadeOut` is called and then the border is removed.
