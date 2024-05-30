# Displaying Images

It's very easy to display images in your Solid App:

```jsx
<View width={200} height={200} src={imgSrc} />
```

Just give any `View` tag a src to an image. Be sure to also give it a width and height for it to display properly. If you want to load images from filesystem, make sure to include them in the `public/` directory. Learn more about [Static Asset Handling](https://vitejs.dev/guide/assets) from Vite.

## Sizing and Scaling and Autosize

The Lightning renderer will scale the image to fit the width and height dimensions provided. If you don't know the size of the image you can use `autosize` attribute for the Renderer to set the image size when it loads.

For the best performance, it's important to keep your source images as small as possible. If you're displaying an image at `200px x 200px`, make sure the image is exactly that size or _smaller_. The latter option may lead to some quality loss, but can positively impact the overall performance of your App.

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

  const onEvents = [
      ['load', handleLoad],
      ['fail', handleFail],
    ];

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
