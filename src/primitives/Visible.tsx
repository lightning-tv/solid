import {
  ParentComponent,
  ResolvedJSXElement,
  createSignal,
  onCleanup,
  createRenderEffect,
  children,
  createRoot,
  on,
} from 'solid-js';
import { ElementNode } from '@lightningtv/solid';

type VisibleProps = {
  when: boolean;
};

export const Visible: ParentComponent<VisibleProps> = (props) => {
  const [current, setCurrent] = createSignal<{
    disposer: VoidFunction;
    childList: ResolvedJSXElement[];
  }>();

  createRenderEffect(
    on(
      () => props.when,
      (condition) => {
        if (condition && !current()) {
          const root = createRoot((dispose) => ({
            disposer: dispose,
            childList: children(() => props.children).toArray(),
          }));
          setCurrent(root);
        }
        const isHidden = !condition;
        current()?.childList.forEach((child) => {
          if (child instanceof ElementNode) {
            child.hidden = isHidden;
          }
        });
      },
    ),
  );

  onCleanup(() => current()?.disposer());

  return <>{current()?.childList}</>;
};
