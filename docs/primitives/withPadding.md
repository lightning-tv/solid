# `withPadding` Directive

The `withPadding` directive is used to add padding to an `ElementNode` whose child is a `<Text>` node.

## Usage

### Padding Input Types

- `number`: Applies the same padding to all four sides.
- `[number, number]`: Applies the first value to the top and bottom, and the second value to the left and right.
- `[number, number, number]`: Applies the first value to the top, the second value to the left and right, and the third value to the bottom.
- `[number, number, number, number]`: Applies the values to the top, right, bottom, and left respectively.

### Example

The `withPadding` directive allows us to create a border around a child text node like below:

```jsx
import { View, Text, withPadding } from '@lightningtv/solid-ui';
withPadding; // prevent treeshaking

const BadgeStyle = {};
const Badge = (props) => {
  return (
    <node
      use:withPadding={[8, 13, 11, 13]}
      {...props}
      style={{
        color: '0x00000099',
        borderRadius: 8,
        border: { width: 2, color: '0xffffffff' },
      }}
    >
      <Text style={BadgeStyle}>{props.children}</Text>
    </node>
  );
};

<Badge>Hello There</Badge>;
```
