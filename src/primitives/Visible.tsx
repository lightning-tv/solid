import {
  DEV,
  children,
  createMemo,
  ChildrenReturn,
  JSX,
  untrack,
  onCleanup,
  createRoot,
} from 'solid-js';
import { ElementNode } from '@lightningtv/solid';

export function Visible<T>(props: {
  when: T | undefined | null | false;
  keyed?: boolean;
  fallback?: JSX.Element;
  children: JSX.Element;
}): JSX.Element {
  let child: ChildrenReturn | undefined;
  let disposer: VoidFunction | undefined;
  const keyed = props.keyed;
  const condition = createMemo<T | undefined | null | boolean>(
    () => props.when,
    undefined,
    DEV
      ? {
          equals: (a, b) => (keyed ? a === b : !a === !b),
          name: "condition"
        }
      : { equals: (a, b) => (keyed ? a === b : !a === !b) }
  );

  onCleanup(() => disposer?.());


  return createMemo(() => {
    const c = condition();
    const isKeyed = untrack(() => !!keyed);
    if (isKeyed){
      disposer?.();
      child = undefined;
    }

    if (c && !child) {
      disposer = createRoot((dispose) => {
        child = children(() => props.children);
        return dispose;
      })
    }

    const isHidden = !c;
    child?.toArray().forEach((childNode) => {
      if (childNode instanceof ElementNode) {
        childNode.hidden = isHidden;
      }
    });

    return c ? child : props.fallback;
  }) as unknown as JSX.Element;
};
