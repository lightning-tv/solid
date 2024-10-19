# Hash Router

The `HashRouter` primitive is based on the [SolidJS Router](https://github.com/solidjs/solid-router), optimized for TV devices. It is a clone of the Solid router, with native click handling removed, and includes a `paramsWrapper` for compatibility with older browsers that do not support `Proxy`.

### Usage

```jsx
import { HashRouter } from '@lightningtv/solid/primitives';

<HashRouter root={App}>
  <Route path="/" component={HelloWorld} />
  <Route path="/text" component={TextPage} />
  <Route path="/*all" component={NotFound} />
</HashRouter>;
```
