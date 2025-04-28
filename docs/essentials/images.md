# Displaying Images

It's very easy to display images in your Solid App:

```jsx
<View width={200} height={200} src={imgSrc} />
```

Just give any `View` tag a src to an image. Be sure to also give it a width and height for it to display properly. If you want to load images from filesystem, make sure to include them in the `public/` directory. Learn more about [Static Asset Handling](https://vitejs.dev/guide/assets) from Vite.

> If you lazy load images (src isn't known at time initial node is created), then you'll need to set color=0xffffffff otherwise the image won't be visible.

## Sizing and Scaling and Autosize

The Lightning renderer will scale the image to fit the width and height dimensions provided. If you don't know the size of the image you can use `autosize` attribute for the Renderer to set the image size when it loads.

For the best performance, it's important to keep your source images as small as possible. If you're displaying an image at `200px x 200px`, make sure the image is exactly that size or _smaller_. The latter option may lead to some quality loss, but can positively impact the overall performance of your App.

## textureOptions for images

- **`preload`** (`boolean`, default: `false`):
  Load the texture immediately, even if it's not yet rendered. Reduces delay when the image first appears.

- **`preventCleanup`** (`boolean`, default: `false`):
  Prevent the texture from being unloaded when unused. Useful for persistent or frequently reused images.

- **`flipX`** (`boolean`, default: `false`):
  Flips the image horizontally.

- **`flipY`** (`boolean`, default: `false`):
  Flips the image vertically.

- **`resizeMode`** (`object`):
  Determines how the image fits within a given space. Options:
  - `type: 'cover'`: Scales and crops the image to fill the space. Optional `clipX` and `clipY` values (0–1) control the crop origin.
  - `type: 'contain'`: Scales the image to fit within the space without cropping.

```jsx
<View
  src={props.imgSrc}
  width={100}
  textureOptions={{
    resizeMode: {
      type: 'contain',
    },
  }}
/>
```

## SVG Images

The renderer does support SVG images, just set the src.

## Loaded Events / Failback Images / Poster background color

All images are loaded asynchronously (and can possibly fail to load). Here is how you'd provide a fallback image.

```jsx
// Create the Thumbnail component
const Thumbnail = (props) => (
  const handleLoad = (node) => {
    node.color = 0xffffffff;
  };

  const handleFail = (node, msg) => {
    node.src = fallbackImage;
  };

  const onEvent = {
    loaded: handleLoad,
    failed: handleFail,
  };

  <View
    width={200}
    height={200}
    // Add loading background color
    color={0xff573366}
    src={props.imgSrc}
    onEvents={onEvents}
  />
);
```

## Colorization

You also have the option to _colorize_ an image. Just add a `color` attribute. You can use a single color, or apply a gradient.

```jsx
<View
  width={200}
  height={200}
  src={imgSrc}
  colorTop={0xffffffff}
  colorBottom={0x000000ff}
/>
```
