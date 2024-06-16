# Screen Resolution

By default, the screen resolution of the app is set to 1920x1080, commonly known as 1080p. This means you will develop your application in a fixed resolution of 1920x1080, and then scale it to fit the TV's actual resolution using the `deviceLogicalPixelRatio`. Once the app loads, it maintains a constant screen size, adjusting the scaling based on the TV's resolution.

Most TVs have a 16:9 aspect ratio, so the scaling is handled proportionally using the `deviceLogicalPixelRatio` to ensure the app looks correct on different screens. The scaling factor is determined based on the height of the TV screen relative to 1080 pixels.

Here is how you can set up and use screen resolution in your application:

```jsx
import { render, Config, Text } from '@lightningtv/solid';

Config.rendererOptions = {
  appWidth: 1920,
  appHeight: 1080,
  // Calculate deviceLogicalPixelRatio based on window height
  // Common ratios: 720p = 0.666667, 1080p = 1, 1440p = 1.5, 2160p = 2
  deviceLogicalPixelRatio: window.innerHeight / 1080,
};

render(() => <Text>Hello World</Text>);
```

### Explanation:

1. **appWidth**: The fixed width of your application. Set to 1920 pixels.
2. **appHeight**: The fixed height of your application. Set to 1080 pixels.
3. **deviceLogicalPixelRatio**: This determines the scaling factor. It is calculated by dividing the window's inner height by 1080 (the height in pixels of the 1080p standard resolution).

### Scaling Ratios:

- **720p (HD)**: `deviceLogicalPixelRatio` is approximately 0.666667 (720 / 1080)
- **1080p (Full HD)**: `deviceLogicalPixelRatio` is 1 (1080 / 1080)
- **1440p (2K)**: `deviceLogicalPixelRatio` is approximately 1.5 (1440 / 1080)
- **2160p (4K)**: `deviceLogicalPixelRatio` is 2 (2160 / 1080)

By setting `deviceLogicalPixelRatio` based on the window height, your application will scale correctly to fit the TV's resolution while maintaining the designed aspect ratio and layout.

---

This approach ensures that your application is resolution-independent and can provide a consistent user experience across different TV resolutions.
