# createBlurredImage

`createBlurredImage` is a primitive that creates a blurred version of an image. It returns a resource that contains the blurred image as a data URL.

## Usage

Import the `createBlurredImage` function and use it in your component. It takes an accessor function for the image URL and an optional options object.

```tsx
import { createBlurredImage } from '@lightningjs/solid';
import { Image } from '@lightningjs/solid/primitives';

const MyComponent = () => {
  const imageUrl = () => 'https://example.com/image.jpg';
  const blurredImage = createBlurredImage(imageUrl, { radius: 15 });

  return <Image src={blurredImage()} />;
};
```

## Options

The `createBlurredImage` function accepts an optional options object with the following properties:

- `radius` (optional): The blur radius in pixels. Defaults to `10`.
- `crossOrigin` (optional): The CORS setting for image loading. Defaults to `'anonymous'`.
- `resolution` (optional): The resolution of the output image in pixels. Defaults to `1`.

## How it Works

The `createBlurredImage` primitive uses a two-step process to create a blurred image:

1.  **Image Loading**: It first loads the image from the provided URL.
2.  **Gaussian Blur**: It then applies a Gaussian blur to the image data. If the browser supports the `filter` property on the 2D canvas context, it uses that for better performance. Otherwise, it falls back to a manual implementation of the Gaussian blur algorithm.

The result is a data URL representing the blurred image, which can be used as the `src` for an `Image` component.
