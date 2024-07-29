# Device Support for L3 & Solid

SolidJS is a versatile web framework compatible with a wide range of browsers. It supports browsers as early as Chrome 38+, though it utilizes JavaScript [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), a feature introduced in Chrome 49.

Lightning, a WebGL renderer, employs a canvas tag. On PlayStation, WebGL is disabled, necessitating the use of canvas2d mode for Lightning. Both SolidJS and Lightning have been tested on Chrome 49+.

To ensure compatibility, you can test your setup with the hosted [TMDB Demo App](https://lightning-tv.github.io/solid-demo-app/). If you encounter any issues, please report them.

Chrome 49+ is available as early as:

- LG WebOS 4+
- Tizen 2018+
