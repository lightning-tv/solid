# Device Support for L3 & Solid

SolidJS is a versatile web framework compatible with a wide range of browsers. It supports browsers as early as Chrome 38+, though it utilizes JavaScript [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), a feature introduced in Chrome 49.

Lightning, a WebGL renderer, employs a canvas tag. On PlayStation, WebGL is disabled, necessitating the use of canvas2d mode for Lightning. Both SolidJS and Lightning have been tested and confirmed working on Chrome 38+.

To ensure compatibility, you can test your setup with the hosted [TMDB Demo App](https://lightning-tv.github.io/solid-demo-app/). If you encounter any issues, please report them.

Chrome 38+ is available as early as:

- [LG WebOS 3+ 2016+](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine)
- [Tizen 2017+](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html)

## Running on Chrome 38

Getting Solid running without Proxies

<img src="images/Chrome38.jpeg" alt="Solid on Chrome 38+" style="width: 45%;">
