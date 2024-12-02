import { getOwner, runWithOwner, createMemo } from 'solid-js';
import {
  type BaseRouterProps,
  createRouter,
  createBeforeLeave,
  keepDepth,
  notifyIfNotBlocked,
  saveCurrentDepth,
  type RouteDescription,
  type RouteMatch,
} from '@solidjs/router';
import type { JSX } from 'solid-js';

export function hashParser(str: string) {
  const to = str.replace(/^.*?#/, '');
  // Hash-only hrefs like `#foo` from plain anchors will come in as `/#foo` whereas a link to
  // `/foo` will be `/#/foo`. Check if the to starts with a `/` and if not append it as a hash
  // to the current path so we can handle these in-page anchors correctly.
  if (!to.startsWith('/')) {
    const [, path = '/'] = window.location.hash.split('#', 2);
    return `${path}#${to}`;
  }
  return to;
}

export type HashRouterProps = BaseRouterProps & {
  actionBase?: string;
  explicitLinks?: boolean;
  preload?: boolean;
  forceProxy?: boolean;
  queryParams?: string[];
};

export function bindEvent(
  target: EventTarget,
  type: string,
  handler: EventListener,
) {
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
}

export function HashRouter(props: HashRouterProps): JSX.Element {
  const getSource = () => window.location.hash.slice(1);
  const beforeLeave = createBeforeLeave();
  return createRouter({
    get: getSource,
    set({ value, replace, state }) {
      if (replace) {
        window.history.replaceState(keepDepth(state), '', '#' + value);
      } else {
        window.history.pushState(state, '', '#' + value);
      }
      saveCurrentDepth();
    },
    init: (notify) =>
      bindEvent(
        window,
        'hashchange',
        notifyIfNotBlocked(
          notify,
          (delta) =>
            !beforeLeave.confirm(delta && delta < 0 ? delta : getSource()),
        ),
      ),
    utils: {
      go: (delta) => window.history.go(delta),
      renderPath: (path) => `#${path}`,
      parsePath: hashParser,
      beforeLeave,
      queryWrapper:
        props.forceProxy || !SUPPORTS_PROXY
          ? (getQuery) => {
              return createMemoWithoutProxy(getQuery, props.queryParams);
            }
          : undefined,
      paramsWrapper:
        props.forceProxy || !SUPPORTS_PROXY
          ? (buildParams, branches) => {
              return createMemoWithoutProxy(
                buildParams,
                collectDynamicParams(branches()),
              );
            }
          : undefined,
    },
  })(props);
}

export const SUPPORTS_PROXY = typeof Proxy === 'function';
export function createMemoWithoutProxy<
  T extends Record<string | symbol, unknown>,
>(fn: () => T, allKeys?: string[]): T {
  const map = new Map();
  const owner = getOwner()!;
  const target = {} as T;

  const handler = (property: keyof T) => {
    if (!map.has(property)) {
      runWithOwner(owner, () =>
        map.set(
          property,
          createMemo(() => fn()[property]),
        ),
      );
    }
    return map.get(property)!();
  };

  const keys = allKeys ? allKeys : (Object.keys(fn()) as (keyof T)[]);

  keys.forEach((key) => {
    Object.defineProperty(target, key, {
      get: () => handler(key),
      enumerable: true,
      configurable: true,
    });
  });

  return target;
}

export interface Branch {
  routes: RouteDescription[];
  score: number;
  matcher: (location: string) => RouteMatch[] | null;
}

export const collectDynamicParams = (branches: Branch[]) => {
  const dynamicParams: string[] = [];

  branches.forEach((branch) => {
    branch.routes.forEach((route) => {
      if (route.pattern) {
        const matches = route.pattern.match(/:(\w+)/g);
        if (matches) {
          matches.forEach((param) => {
            const p = param.slice(1); // Remove the `:`
            if (!dynamicParams.includes(p)) dynamicParams.push(p);
          });
        }
      }
    });
  });

  return dynamicParams;
};
