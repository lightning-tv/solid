import {
  Index,
  createEffect,
  createMemo,
  createSignal,
  Show,
  onCleanup,
  type JSX,
  type ValidComponent,
} from 'solid-js';
import { Dynamic, type ElementNode } from '@lightningtv/solid';
import { Row, Column } from '@lightningtv/solid/primitives';

type LazyProps<T extends readonly any[], U extends JSX.Element> = ElementNode & {
  each: T | undefined | null | false;
  fallback?: JSX.Element;
  component?: ValidComponent;
  upCount: number;
  delay?: number;
  async?: boolean;
  children: (item: T[number], index: number) => U;
};

function createLazy<T extends readonly any[], U extends JSX.Element>(
  props: LazyProps<T, U>,
  keyHandler: (updateOffset: () => void) => Record<string, () => void>
) {
  const [offset, setOffset] = createSignal(props.selected ?? 0);
  const [asyncCount, setAsyncCount] = createSignal(0);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => setOffset(props.selected ?? 0));

  createEffect(() => {
    if (props.async && props.each) {
      setAsyncCount(0);
      let count = 0;

      const loadItems = () => {
        if (count < props.upCount + offset()) {
          setAsyncCount(count + 1);
          timeoutId = setTimeout(loadItems, 1);
          count++;
        }
      };

      loadItems();
    } else {
      setAsyncCount(props.upCount + offset());
    }
  });

  const items = createMemo(() => (Array.isArray(props.each) ? props.each.slice(0, asyncCount() + offset()) : []));

  const updateOffset = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setOffset((prev) => Math.min(prev + 1, (Array.isArray(props.each) ? props.each.length : 0) - props.upCount));
    }, props.delay ?? 0);
  };

  onCleanup(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  return (
    <Show when={items().length > 0} fallback={props.fallback}>
      <Dynamic component={props.component} {...props} {...keyHandler(updateOffset)}>
        <Index each={items()}>{props.children}</Index>
      </Dynamic>
    </Show>
  );
}

export function LazyRow<T extends readonly any[], U extends JSX.Element>(props: LazyProps<T, U>) {
  props.component = Row;
  return createLazy(props, (updateOffset) => ({ onRight: updateOffset }));
}

export function LazyColumn<T extends readonly any[], U extends JSX.Element>(props: LazyProps<T, U>) {
  props.component = Column;
  return createLazy(props, (updateOffset) => ({ onDown: updateOffset }));
}
