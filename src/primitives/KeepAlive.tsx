import { Route } from "@solidjs/router";
import * as s from 'solid-js';

export interface KeepAliveElement {
  id: string;
  owner: s.Owner | null;
  children?: s.JSX.Element;
  routeSignal?: s.Signal<unknown>;
  dispose: () => void;
}

const keepAliveElements = new Map<string, KeepAliveElement>();

export const storeElement = (
  element: KeepAliveElement
): KeepAliveElement | undefined => {
  if (keepAliveElements.has(element.id)) {
    console.warn(`[KeepAlive] Element with id "${element.id}" already in cache. Recreating.`);
    removeElement(element.id);
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
}

function wrapChildren(props) {
  return (
    <view
      preserve
      onRemove={(elm) => (elm.alpha = 0)}
      onRender={(elm) => {
        elm.alpha = 1;
        elm.children[0]?.setFocus();
      }}
      forwardFocus={0}
      transition={{ alpha: true }}
      {...props}
    />)
}

export const KeepAliveWrapper = (Component) => {
  return (props: s.ParentProps<KeepAliveProps>) => {
    const existing = keepAliveElements.get(props.id)

    if (!existing) {
      s.createRoot((dispose) => {
        storeElement({
          id: props.id,
          owner: s.getOwner(),
          children: (<view
            preserve
            onRemove={(elm) => (elm.alpha = 0)}
            onRender={(elm) => {
              elm.alpha = 1;
              elm.children[0]?.setFocus();
            }}
            forwardFocus={0}
            transition={{ alpha: true }}
          ><Component {...props} /></view>),
          dispose,
        });
      });
    }

    if (existing && !existing.children) {
      existing.children = s.runWithOwner(existing.owner, () => wrapChildren(props));
    }

    return () => {
      const current = keepAliveElements.get(props.id);
      return current?.owner
        ? s.runWithOwner(current.owner, () => current.children)
        : null;
    };
  }
};

export const KeepAlive = (props: s.ParentProps<KeepAliveProps>) => {
  const existing = keepAliveElements.get(props.id)

  if (!existing) {
    s.createRoot((dispose) => {
      storeElement({
        id: props.id,
        owner: s.getOwner(),
        children: wrapChildren(props),
        dispose,
      });
    });
  }

  if (existing && !existing.children) {
    existing.children = s.runWithOwner(existing.owner, () => wrapChildren(props));
  }

  return () => {
    const current = keepAliveElements.get(props.id);
    return current?.owner
      ? s.runWithOwner(current.owner, () => current.children)
      : null;
  };
};

export const KeepAliveRoute = (props) => {
  const key = props.id || props.path;

  const preload = props.preload ? (preloadProps) => {
    const existing = keepAliveElements.get(props.id)

    if (!existing) {
      s.createRoot((dispose) => {
        storeElement({
          id: key,
          owner: s.getOwner(),
          dispose,
          routeSignal: s.createSignal(),
        });
      });
    }
    const current = keepAliveElements.get(key);
    if (current) {
    const [routeProps, setRouteProps] = current.routeSignal;
    if (routeProps()) {
      setRouteProps(preloadProps);
      return;
    }
    setRouteProps(preloadProps);
    return current?.owner ?
      s.runWithOwner(current.owner, () => {
        return props.preload(routeProps)
      })
      : null;
    }
  } : undefined;

  return (<Route {...props}
      preload={preload}
      component={(childProps) =>
        <KeepAlive id={key}>
          {props.component(childProps)}
        </KeepAlive>
      }
    />);
};
