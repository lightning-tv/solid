import { Route, RoutePreloadFuncArgs, RouteProps } from '@solidjs/router';
import * as s from 'solid-js';
import { ElementNode, activeElement } from '@lightningtv/solid';
import { chainFunctions } from './utils/chainFunctions.js';

export interface KeepAliveElement {
  id: string;
  owner: s.Owner | null;
  children: s.JSX.Element;
  routeSignal?: s.Signal<unknown>;
  dispose: () => void;
}

const keepAliveElements = new Map<string, KeepAliveElement>();
export const keepAliveRouteElements = new Map<string, KeepAliveElement>();

const _storeKeepAlive = (
  map: Map<string, KeepAliveElement>,
  element: KeepAliveElement,
): KeepAliveElement | undefined => {
  if (map.has(element.id)) {
    console.warn(
      `[KeepAlive] Element with id "${element.id}" already in cache.`,
    );
    return element;
  }
  map.set(element.id, element);
  return element;
};

export const storeKeepAlive = (element: KeepAliveElement) =>
  _storeKeepAlive(keepAliveElements, element);
export const storeKeepAliveRoute = (element: KeepAliveElement) =>
  _storeKeepAlive(keepAliveRouteElements, element);

const _removeKeepAlive = (
  map: Map<string, KeepAliveElement>,
  id: string,
): void => {
  const element = map.get(id);
  if (element) {
    element.dispose();
    map.delete(id);
  }
};

export const removeKeepAlive = (id: string): void =>
  _removeKeepAlive(keepAliveElements, id);
export const removeKeepAliveRoute = (id: string): void =>
  _removeKeepAlive(keepAliveRouteElements, id);

const _clearKeepAlive = (map: Map<string, KeepAliveElement>): void => {
  map.forEach((element) => element.dispose());
  map.clear();
};

export const clearKeepAlive = (): void => _clearKeepAlive(keepAliveElements);
export const clearKeepAliveRoute = (): void =>
  _clearKeepAlive(keepAliveRouteElements);

interface KeepAliveProps {
  id: string;
  shouldDispose?: (key: string) => boolean;
  onRemove?: ElementNode['onRemove'];
  onRender?: ElementNode['onRender'];
  transition?: ElementNode['transition'];
}

function wrapChildren(props: s.ParentProps<KeepAliveProps>) {
  const onRemove =
    props.onRemove ||
    ((elm: ElementNode) => {
      elm.alpha = 0;
    });
  const onRender =
    props.onRender ||
    ((elm: ElementNode) => {
      elm.alpha = 1;
    });
  const transition = props.transition || { alpha: true };

  return (
    <view
      preserve
      onRemove={onRemove}
      onRender={onRender}
      forwardFocus={0}
      transition={transition}
      {...props}
    />
  );
}

const createKeepAliveComponent = (
  map: Map<string, KeepAliveElement>,
  storeFn: (element: KeepAliveElement) => KeepAliveElement | undefined,
) => {
  return (props: s.ParentProps<KeepAliveProps>) => {
    let existing = map.get(props.id);

    if (
      existing &&
      (props.shouldDispose?.(props.id) ||
        (existing.children as unknown as ElementNode)?.destroyed)
    ) {
      existing.dispose();
      map.delete(props.id);
      existing = undefined;
    }

    if (!existing) {
      return s.createRoot((dispose) => {
        const children = wrapChildren(props);
        storeFn({
          id: props.id,
          owner: s.getOwner(),
          children,
          dispose,
        });
        return children;
      });
    } else if (existing && !existing.children) {
      existing.children = s.runWithOwner(existing.owner, () =>
        wrapChildren(props),
      );
    }
    return existing.children;
  };
};

export const KeepAlive = createKeepAliveComponent(
  keepAliveElements,
  storeKeepAlive,
);
const KeepAliveRouteInternal = createKeepAliveComponent(
  keepAliveRouteElements,
  storeKeepAliveRoute,
);

export const KeepAliveRoute = <S extends string>(
  props: RouteProps<S> & {
    id?: string;
    path: string;
    component: s.Component<RouteProps<S>>;
    shouldDispose?: (key: string) => boolean;
    onRemove?: ElementNode['onRemove'];
    onRender?: ElementNode['onRender'];
    transition?: ElementNode['transition'];
  },
) => {
  const key = props.id || props.path;
  let savedFocusedElement: ElementNode | undefined;

  const onRemove = chainFunctions(props.onRemove, (elm: ElementNode) => {
    savedFocusedElement = activeElement() as ElementNode;
    elm.alpha = 0;
  });

  const onRender = chainFunctions(props.onRender, (elm: ElementNode) => {
    let isChild = false;
    let current = savedFocusedElement;
    while (current) {
      if (current === elm) {
        isChild = true;
        break;
      }
      current = current.parent as ElementNode | undefined;
    }

    if (isChild && savedFocusedElement) {
      savedFocusedElement.setFocus();
    } else {
      elm.setFocus();
    }
    elm.alpha = 1;
  });

  const preload = props.preload
    ? (preloadProps: RoutePreloadFuncArgs) => {
        let existing = keepAliveRouteElements.get(key);

        if (
          existing &&
          (props.shouldDispose?.(key) ||
            (existing.children as unknown as ElementNode)?.destroyed)
        ) {
          existing.dispose();
          keepAliveRouteElements.delete(key);
          existing = undefined;
        }

        if (!existing) {
          return s.createRoot((dispose) => {
            storeKeepAliveRoute({
              id: key,
              owner: s.getOwner(),
              dispose,
              children: null,
            });
            return props.preload!(preloadProps);
          });
        } else if (existing.children) {
          (existing.children as unknown as ElementNode)?.setFocus();
        }
      }
    : undefined;

  return (
    <Route
      {...props}
      preload={preload}
      component={(childProps) => (
        <KeepAliveRouteInternal
          id={key}
          onRemove={onRemove}
          onRender={onRender}
          transition={props.transition}
        >
          {props.component(childProps)}
        </KeepAliveRouteInternal>
      )}
    />
  );
};
