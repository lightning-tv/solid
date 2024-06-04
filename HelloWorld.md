<p>
  <img src="https://assets.solidjs.com/banner?project=Library&type=solid-lightning" alt="SolidJS Lightning" />
</p>

# solid-lightning

Solid-Lightning is a UI framework for [Lightning Renderer](https://lightningjs.io/) built with [SolidJS](https://www.solidjs.com/) Universal Renderer. It allows you to declaratively construct lightning nodes with reactive primitives, just as you would construct a DOM tree in SolidJS.

## Setting Up Your Development Environment

Make a directory for your app, for our app we are going to use 'helloworld'.

```sh
mkdir helloworld
cd helloworld
```

Install the dependencies required to run the app with [SolidJS](https://www.solidjs.com/) and [Lightning Renderer](https://lightningjs.io/).

```sh
npm install vite@4.5.0 vite-plugin-solid@2.7.2 --save-dev
npm install @lightningjs/solid @lightningjs/solid-primitives solid-js @solidjs/router @lightningjs/vite-plugin-import-chunk-url --save
```

Create a config file voor vite for [SolidJS](https://www.solidjs.com/) and [Lightning Renderer](https://lightningjs.io/) in the root of your app directory named 'vite.config.js'
Add the following code to this file.

```sh
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { importChunkUrl } from '@lightningjs/vite-plugin-import-chunk-url';

export default defineConfig({
   plugins: [importChunkUrl(), solidPlugin({
     solid: {
       moduleName: "@lightningjs/solid",
       generate: 'universal',
     },
   })],
   resolve: {
     dedupe: ['solid-js', '@lightningjs/solid', '@lightningjs/renderer'],
   },
   optimizeDeps: {
     include: [],
     exclude: [
     '@lightningjs/solid',
     '@lightningjs/solid-primitives',
     '@lightningjs/renderer/core',
     '@lightningjs/renderer/workers/renderer']
   },
   server: {
     hmr: true,
     headers: {
       'Cross-Origin-Opener-Policy': 'same-origin',
       'Cross-Origin-Embedder-Policy': 'require-corp',
     },
   },
 });
```

Create a file named 'index.html' in the root of your app directory. This is entry point for the browser and add the following code.

```sh
<!DOCTYPE html>
<html>

<head>
  <title>Solid Hello World</title>
  <meta charset="UTF-8" />
  <style>
    html, body, * { padding: 0; margin: 0}
  </style>
</head>

<body>
  <div id="app"></div>
  <script type="module" src="./src/index.jsx"></script>
</body>

</html>
```

The index.html starts the App in the 'src/index.jsx' file. So also create that file in that folder.

Add the following to package.json so you can start the development server with 'npm start'

```sh
  "type": "module",
  "scripts": {
    "start": "vite --open --host"
  },
```

Now we have everything ready to start building our app

### Add font with a Core Extention

To load fonts, and/or other custom code into the Core Space, you must write a Core Extension and pass it via dynamically importable URL to the initialization of the Renderer.

Create a file for example './src/AppCoreExtensions.js' and add the following code:

```jsx
import { CoreExtension, SdfTrFontFace } from '@lightningjs/renderer/core';

export default class AppCoreExtension extends CoreExtension {
  async run(stage) {
    stage.fontManager.addFontFace(
      new SdfTrFontFace(
        'Ubuntu',
        {},
        'msdf',
        stage,
        '/fonts/Ubuntu-Bold.msdf.png',
        '/fonts/Ubuntu-Bold.msdf.json',
      ),
    );
  }
}
```

Change to 2 lines with Ubuntu-Bold.msdf.\*\* to your own font that you have in stored in './public/fonts/'\
Here is a link to the fonts used in this Hello World: https://github.com/lightning-js/renderer/tree/main/examples/public/fonts

# Usage

Most of the things you do with Solid will carry over to using Solid-Lightning with some key differences as Lightning does not use HTML / DOM / CSS / Mouse Input.

## Hello World

Our first app, lets put some text in our app. Put the following code in the file './src/index.jsx'

```jsx
import { render, Text, Config } from '@lightningjs/solid';
import coreExtensionModuleUrl from './AppCoreExtensions.js?importChunkUrl';

Config.rendererOptions = {
  coreExtensionModule: coreExtensionModuleUrl,
};
render(() => <Text>Hello World</Text>);
```

Here we also load the previously created AppCoreExtension file and pass it to the Config.

Start the development server with the following command:

```sh
npm start
```

A page in your browser should open, and everytime you make changes in your app it should reflect in the browser.

## Built In Components

### Text

Whenever you want to display text, wrap it in a `<Text>` tag like so `<Text>Hello World</Text>`. Default a `<Text>` has a white color so when using our first example above there is nothing to see yet. Lets fix this and add a color. Change the `<Text>` to `<Text color={0x000000ff}>`.

### View

Think of `<View>` like div tag for HTML, all encompassing.

### Styling / Properties

You can add styles to your JSX components using object notation or applying the properties directly to the JSX or via a ref:

```jsx
import { render, View, Text } from '@lightningjs/solid';
import coreExtensionModuleUrl from './AppCoreExtensions.js?importChunkUrl';

const helloworldText = {
  width: 1920,
  height: 170,
  lineHeight: 170,
  y: 455,
  contain: 'both',
  fontSize: 100,
  textAlign: 'center',
  color: '0x000000ff',
};
render(() => (
  <View>
    <Text style={helloworldText}>Hello World!</Text>
  </View>
));
```

The style attribute takes an object of properties and passes them to the Lightning Renderer on initial creation of the component. The style object will not be reapplied if it is changed after creation. This keeps the style object as Read Only in the templating system allowing you to use it for multiple components. Additionally, when the style object is applied any properties on the JSX will have greater precedent so you can override styles on individual components. After the component is created, you can further change props via signals or imperatively with the ref to the component.

## Adding interaction to your APP

### Making your own reusable components

Everything is built with two primitive components: `<View>` and `<Text>`. So now with this knowledge lets build a button that we can use multiple times.

Create a new file './src/Button.jsx' and put the following into it:

```jsx
import { View, Text } from '@lightningjs/solid';

const styles = {
  container: {
    width: 200,
    height: 65,
    color: 0x1e0045ff,
    border: { width: 5, color: 0x1e3345ff },
    focus: {
      color: [0x58807dff, { duration: 1000 }],
    },
    disabled: {
      color: 0x1e004533,
    },
  },
};

styles.text = {
  fontSize: 32,
  contain: 'width',
  textAlign: 'center',
  mountY: -0.35,
  height: styles.container.height,
  width: styles.container.width,
};

export default function Button(props) {
  return (
    <View {...props} forwardStates animate style={styles.container}>
      <Text style={styles.text}>{props.children}</Text>
    </View>
  );
}
```

This is all it takes to make a reusable component. Specify some styles, create the JSX object with the views/text you require and apply the properties on it.

When Button is focused the focus styles will be applied. And when focus is removed, the original styles on the element will be set, meaning you need defaults on the original style to fallback to.

Now we can import this file in the index.jsx and add it inside the view tag.

```jsx
import { render, View, Text } from '@lightningjs/solid';
import coreExtensionModuleUrl from './AppCoreExtensions.js?importChunkUrl';
import Button from './Button';

const helloworldText = {
  width: 1920,
  height: 170,
  lineHeight: 170,
  y: 455,
  contain: 'both',
  fontSize: 100,
  textAlign: 'center',
  color: '0x000000ff',
};
render(() => (
  <View>
    <Text style={helloworldText}>Hello World!</Text>
    <Button autofocus onEnter={(event, el) => el.states.toggle('disabled')}>
      View 1
    </Button>
  </View>
));
```

Now we should have a button in the top left corner, but it cannot be clicked yet.
The basic requirements to get interaction from user working is adding a focusmanager but this will not allow navigation and multiple pages yet.

Add the following into './src/index.jsx' and you get focus on the button and when you press enter it will toggle disabled state of the button:

```jsx
import { useFocusManager } from '@lightningjs/solid-primitives';
useFocusManager();
```

### Adding navigation and multiple pages

This requires us to change what we have so far so we get multiple files for different pages.
The entry file ('./src/index.jsx') for the APP only needs to contain the Routes.

index.jsx:

```jsx
import { render, View } from '@lightningjs/solid';
import coreExtensionModuleUrl from './AppCoreExtensions.js?importChunkUrl';
import { Router, Route } from '@solidjs/router';
import { useFocusManager } from '@lightningjs/solid-primitives';

import Page1 from './Page1';
import Page2 from './Page2';

useFocusManager();

render(() => (
  <Router>
    <Route path="/" component={Page1} />
    <Route path="/page2" component={Page2} />
  </Router>
));
```

We include the pages we have in our APP and define them in our Routes Component with a path and the component as the imported Page.

Now we create the 2 Pages we used inside the Routes:

Page1.jsx:

```jsx
import { useNavigate } from '@solidjs/router';
import { View, Text } from '@lightningjs/solid';
import Button from './Button';

const headlineText = {
  width: 1920,
  height: 170,
  lineHeight: 170,
  y: 455,
  contain: 'both',
  fontSize: 100,
  textAlign: 'center',
};
const headlineSubText = {
  width: 1920,
  height: 170,
  lineHeight: 170,
  y: 655,
  contain: 'both',
  fontSize: 60,
  textAlign: 'center',
};

const Page1 = () => {
  const navigate = useNavigate();

  return (
    <View color={0x071423ff}>
      <Text style={headlineText}>Hello World!</Text>
      <Text style={headlineSubText}>Page 1</Text>
      <Button autofocus onEnter={() => navigate('page2')}>
        Page 2
      </Button>
    </View>
  );
};

export default Page1;
```

Page2.jsx:

```jsx
import { useNavigate } from '@solidjs/router';
import { View, Text } from '@lightningjs/solid';
import Button from './Button';

const headlineText = {
  width: 1920,
  height: 170,
  lineHeight: 170,
  y: 455,
  contain: 'both',
  fontSize: 100,
  textAlign: 'center',
};
const headlineSubText = {
  width: 1920,
  height: 170,
  lineHeight: 170,
  y: 655,
  contain: 'both',
  fontSize: 60,
  textAlign: 'center',
};

const Page2 = () => {
  const navigate = useNavigate();

  return (
    <View color={0x071423ff}>
      <Text style={headlineText}>Hello World!</Text>
      <Text style={headlineSubText}>Page 2</Text>
      <Button autofocus onEnter={() => navigate('/')}>
        Page 1
      </Button>
    </View>
  );
};

export default Page2;
```

When the APP is run now it will show Page1, when you Press Enter it will go to Page2.
On Page2 you can press Enter on the Button to go back to Page1.

This is achieved by useNavigate from solidJS router.
