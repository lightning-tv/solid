# Displaying Text

We've already seen the `<Text>` Tag in action, but here it is again.

```jsx
<Text>Hello There</Text>
```

Anytime you want to display text in the Application you need to wrap it in a `<Text>` tag. You can specify all the normal node props like x, y, width, height, etc as well as text specific properties:

### Available attributes on the Text tag

The Text-tag accepts the following attributes:

- `color` - the color to display for the text, defaults to `white` and can be any of the supported Blits color formats (HTML, hexadecimal or rgb(a))
- `contain` - the strategy for containing text within the bounds, can be `none` (default), `width`, or `both`.
- `fontFamily` - the font family, defaults to `Ubuntu`
- `fontSize` - the font size, defaults to `16`
- `fontStretch` - the font stretch, defaults to `normal`
- `fontStyle` - the font style, defaults to `normal` - `italic` | `oblique`
- `fontWeight` - the font weight, defaults to `normal` - specify a number (400 / 700)
- `letterSpacing` - letterspacing in pixels, defaults to `0`
- `lineHeight` - the spacing between lines in pixels
- `maxLines` - maximum number of lines that will be displayed
- `overflowSuffix` - the suffix to be added when text is cropped due to bounds limits, defaults to `...`
- `textAlign` - the alignment of the text, can be `left`, `right`, or `center`, defaults to `left`. Centering text and aligning text to the right requires the `wordwrap` attribute to be set as well.
- `verticalAlign` - defaults to `middle` - `top` | `middle` | `bottom`

Tags for Canvas Text Rendering (Not Recommended)

- `wordWrap` - the max length of a line of text in pixels, words surpassing this length will be broken and wrapped onto the next line.
- `maxHeight` - maximum height of a text block, lines that don't fit within this height will not be displayed

## Default Text Config

You can set the default options for all `<Text>` nodes before Rendering the App in your index:

```jsx
import { Config } from '@lightningtv/solid';
// Set defaults for all <Text>
Config.fontSettings.fontFamily = 'Ubuntu';
Config.fontSettings.color = 0xffffffff;
Config.fontSettings.fontSize = 30;
```

### SDF and Canvas2d

Compared to Lightning 2, texts have improved a lot in Lightning 3, thanks to the SDF (Signed Distance Field) Text renderer. With the SDF text renderer, texts appear a lot _sharper_ on screen. The SDF technique also allows for better scaling of texts, without them becoming blurry. In general, it's recommended to use the SDF text renderer, but Lightning 3 still has a Canvas2d text renderer as a backup, and you can use both text renderers within the same App.

### Using Custom Fonts

You can also use any custom font that you want, to give your App the unique look and feel that fits with the design. First, you'll need your `.ttf` font and use [MSDF Tool](https://github.com/lightning-js/msdf-generator) to convert your font to SDF.

Then you'll need to register the custom font in the AppCoreExtensions file:

```js
  stage.fontManager.addFontFace(
  new SdfTrFontFace("msdf", {
    fontFamily: "ComicSans",
    descriptors: {
      weight: 400,
    },
    atlasDataUrl: "fonts/ComicSans-Regular.msdf.json",
    atlasUrl: "fonts/ComicSans-Regular.msdf.png",
    stage,
  }),
```

From this moment on you'll be able to use the font `ComicSans` anywhere in your App:

```xml
<Text fontFamily="ComicSans">I'm Comic Sans font!</Text>
```
