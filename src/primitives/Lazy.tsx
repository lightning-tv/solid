import {
  Index,
  createEffect,
  createMemo,
  createSignal,
  Show,
  type JSX,
  type ValidComponent,
  untrack,
} from 'solid-js';
import { Dynamic, type ElementNode } from '@lightningtv/solid';
import { Row, Column } from '@lightningtv/solid/primitives';

type LazyProps<T extends readonly any[], U extends JSX.Element> = ElementNode & {
  each: T | undefined | null | false;
  fallback?: JSX.Element;
  upCount: number;
  delay?: number;
  sync?: boolean;
  children: (item: T[number], index: number) => U;
};

function createLazy<T extends readonly any[], U extends JSX.Element>(
  component: ValidComponent,
  props: LazyProps<T, U>,
  keyHandler: (updateOffset: () => void) => Record<string, () => void>
) {
  const [offset, setOffset] = createSignal(0);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => setOffset(props.selected || 0));

  if (props.sync !== true) {
    createEffect(() => {
      if (props.each) {
        let count = untrack(offset);

        const loadItems = () => {
          if (count < props.upCount) {
            setOffset(count + 1);
            timeoutId = setTimeout(loadItems, 16); // ~30fps
            count++;
          }
        };
        loadItems();
      }
    });
  } else {
    setOffset(props.upCount);
  }

  const items = createMemo(() => (Array.isArray(props.each) ? props.each.slice(0, offset()) : []));

  const updateOffset = () => {
    const maxOffset = props.each ? props.each.length - 1 : 0;
    if (offset() >= maxOffset) return;

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setOffset((prev) => Math.min(prev + 1, maxOffset));
      timeoutId = null;
    }, props.delay ?? 0);
  };

  // Don't need to cleanup because unluckly the timeout didnt finish
  // onCleanup(() => {
  //   if (timeoutId) clearTimeout(timeoutId);
  // });

  return (
    <Show when={items().length > 0} fallback={props.fallback}>
      <Dynamic component={component} {...props} {...keyHandler(updateOffset)}>
        <Index each={items()} children={props.children} />
      </Dynamic>
    </Show>
  );
}

export function LazyRow<T extends readonly any[], U extends JSX.Element>(props: LazyProps<T, U>) {
  return createLazy(Row, props, (updateOffset) => ({ onRight: updateOffset }));
}

export function LazyColumn<T extends readonly any[], U extends JSX.Element>(props: LazyProps<T, U>) {
  return createLazy(Column, props, (updateOffset) => ({ onDown: updateOffset }));
}
