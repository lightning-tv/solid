import { Route, RoutePreloadFuncArgs, RouteProps } from "@solidjs/router";
import * as s from 'solid-js';
import { ElementNode } from "@lightningtv/solid";

export interface KeepAliveElement {
  id: string;
  owner: s.Owner | null;
  children: s.JSX.Element;
  routeSignal?: s.Signal<unknown>;
  dispose: () => void;
}

const keepAliveElements = new Map<string, KeepAliveElement>();

export const storeElement = (
  element: KeepAliveElement
): KeepAliveElement | undefined => {
  if (keepAliveElements.has(element.id)) {
    console.warn(`[KeepAlive] Element with id "${element.id}" already in cache. Recreating.`);
    return element;
  }
  keepAliveElements.set(element.id, element);
  return element;
};

export const removeElement = (id: string): void => {
  const element = keepAliveElements.get(id);
  if (element) {
    element.dispose();
    keepAliveElements.delete(id);
  }
};

interface KeepAliveProps {
  id: string;
  shouldDispose?: (key: string) => boolean;
  onRemove?: ElementNode['onRemove'];
  onRender?: ElementNode['onRender'];
  transition?: ElementNode['transition'];
}

function wrapChildren(props: s.ParentProps<KeepAliveProps>) {
  const onRemove = props.onRemove || ((elm: ElementNode) => { elm.alpha = 0; });
  const onRender = props.onRender || ((elm: ElementNode) => { elm.alpha = 1; });
  const transition = props.transition || { alpha: true };

  return (
    <view
      preserve
      onRemove={onRemove}
      onRender={onRender}
      forwardFocus={0}
      transition={transition}
      {...props}
    />)
}

export const KeepAlive = (props: s.ParentProps<KeepAliveProps>) => {
  let existing = keepAliveElements.get(props.id)

  if (existing && props.shouldDispose?.(props.id)) {
    existing.dispose();
    keepAliveElements.delete(props.id);
    existing = undefined;
  }

  if (!existing) {
    return s.createRoot((dispose) => {
      const children = wrapChildren(props);
      storeElement({
        id: props.id,
        owner: s.getOwner(),
        children,
        dispose,
      });
      return children;
    });
  } else if (existing && !existing.children) {
    existing.children = s.runWithOwner(existing.owner, () => wrapChildren(props));
  }
  return existing.children;
};

export const KeepAliveRoute = <S extends string>(props: RouteProps<S> & {
  id?: string,
  path: string,
  component: s.Component<RouteProps<S>>,
  shouldDispose?: (key: string) => boolean,
  onRemove?: ElementNode['onRemove'];
  onRender?: ElementNode['onRender'];
  transition?: ElementNode['transition'];
}) => {
  const key = props.id || props.path;

  const preload = props.preload ? (preloadProps: RoutePreloadFuncArgs) => {
    let existing = keepAliveElements.get(key)

    if (existing && props.shouldDispose?.(key)) {
      existing.dispose();
      keepAliveElements.delete(key);
      existing = undefined;
    }

    if (!existing) {
      return s.createRoot((dispose) => {
        storeElement({
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
  } : undefined;

  return (<Route {...props} preload={preload} component={(childProps) =>
            <KeepAlive id={key} onRemove={props.onRemove} onRender={props.onRender} transition={props.transition}>
              {props.component(childProps)}
            </KeepAlive>
        }/>);
};
