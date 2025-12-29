# KeepAlive

The `KeepAlive` and `KeepAliveRoute` components provide a mechanism to cache components and routes, preserving their state even when they are unmounted from the component tree. This is particularly useful for TV applications where you want to maintain the state of a page (like position, focused element, and data) when a user navigates away and then returns.

## Usage

The primary way to use this feature is with `KeepAliveRoute`, which is a wrapper around the standard `@solidjs/router` `Route` component. It automatically handles caching the route's component.

### Caching a Route

By using `KeepAliveRoute`, you can ensure that when a user navigates back to a previously visited route, it will be displayed in the exact same state as they left it.

```jsx
import { KeepAliveRoute } from '@lightningtv/solid';
import { Browse, browsePreload } from './pages/Browse';

const AppRoutes = () => {
  return (
    <Router>
      {/* The Browse page will be kept in memory */}
      <KeepAliveRoute
        id="browse"
        path="browse/:filter"
        component={Browse}
        preload={browsePreload}
      />
      {/* Other routes */}
    </Router>
  );
};
```

In the example above, the `Browse` component's state will be preserved. When you navigate away and then back to a `/browse/...` URL, the page will render instantly from the cache, showing exactly what was there before.

### IMPORTANT PRELOAD TIPS

If using preload functions with props

```js
export function browsePreload(props) {
  let lastFilter = null;
  return s.createMemo((p) => {
    const params = props.params;
    if (p && (!params.filter || lastFilter === params.filter)) {
      return p;
    }
    const provider = browseProvider(params.filter || 'all');
    provider(1);
    lastFilter = params.filter || lastFilter;

    return provider;
  });
}
```

Note that the createMemo will be recalculated when you navigate away as params will change / are reactive. Make sure you don't update your response in those instances or the page will be updated.

### Removing Cached Components

You can manually remove a cached component using the `removeKeepAlive` function. This allows you to clear the cache for a specific route or component programmatically.

```js
import { removeKeepAlive } from '@lightningtv/solid';

// Remove the cached component with the id 'browse'
removeKeepAlive('browse');
```

## API

### `<KeepAliveRoute>`

A wrapper around `@solidjs/router`'s `<Route>` that caches the rendered component.

| prop            | type                        | description                                                                                              |
| --------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `id`            | `string`                    | **Required.** A unique identifier for the cached route.                                                  |
| `path`          | `string`                    | The path for the route, same as `<Route>`.                                                               |
| `component`     | `Component`                 | The component to render for the route, same as `<Route>`.                                                |
| `preload`       | `RoutePreloadFunc`          | The preload function for the route, same as `<Route>`.                                                   |
| `shouldDispose` | `(key: string) => boolean`  | A function that is called to determine if a cached route should be disposed and recreated on next visit. |
| `onRemove`      | `ElementNode['onRemove']`   | Custom `onRemove` transition for the wrapper view. Defaults to `alpha = 0`.                              |
| `onRender`      | `ElementNode['onRender']`   | Custom `onRender` transition for the wrapper view. Defaults to `alpha = 1`.                              |
| `transition`    | `ElementNode['transition']` | Custom `transition` for the wrapper view. Defaults to `{ alpha: true }`.                                 |

### `<KeepAlive>`

A component that caches its children. `<KeepAliveRoute>` uses this component internally. You can use it directly if you need to cache a component that is not part of a route.

| prop            | type                        | description                                                                                    |
| --------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`            | `string`                    | **Required.** A unique identifier for the cached component.                                    |
| `shouldDispose` | `(key: string) => boolean`  | A function that is called to determine if a cached component should be disposed and recreated. |
| `onRemove`      | `ElementNode['onRemove']`   | Custom `onRemove` transition for the wrapper view. Defaults to `alpha = 0`.                    |
| `onRender`      | `ElementNode['onRender']`   | Custom `onRender` transition for the wrapper view. Defaults to `alpha = 1`.                    |
| `transition`    | `ElementNode['transition']` | Custom `transition` for the wrapper view. Defaults to `{ alpha: true }`.                       |

### Functions

#### `removeKeepAlive`

```ts
function removeKeepAlive(id: string): void;
```

Manually removes a cached component by its ID.
