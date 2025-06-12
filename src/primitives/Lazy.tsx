import {
  Index,
  createEffect,
  createMemo,
  createSignal,
  Show,
  type JSX,
  type ValidComponent,
  untrack,
  type Accessor,
} from 'solid-js'; // Dynamic removed
import { type NewOmit, scheduleTask, type NodeProps, Dynamic } from '@lightningtv/solid'; // Dynamic removed from imports
import { Row, Column } from '@lightningtv/solid/primitives';

type LazyProps<T extends readonly any[]> = NewOmit<NodeProps, 'children'> & {
  each: T | undefined | null | false;
  fallback?: JSX.Element;
  upCount: number;
  delay?: number;
  sync?: boolean;
  eagerLoad?: boolean;
  children: (item: Accessor<T[number]>, index: number) => JSX.Element;
};

function createLazy<T>(
  component: ValidComponent,
  props: LazyProps<readonly T[]>,
  keyHandler: (updateOffset: () => void) => Record<string, () => void>
) {
  // Need at least one item so it can be focused
  const [offset, setOffset] = createSignal<number>(props.sync ? props.upCount : 1);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => setOffset(offset => Math.max(offset, (props.selected || 0) + 1)));

  if (!props.sync || props.eaglerLoad) {
    createEffect(() => {
      if (props.each) {
        const loadItems = () => {
          let count = untrack(offset);
          if (count < props.upCount) {
            setOffset(count + 1);
            timeoutId = setTimeout(loadItems, 16); // ~60fps
            count++;
          } else if (props.eagerLoad) {
            const maxOffset = props.each ? props.each.length : 0;
            if (offset() >= maxOffset) return;
            setOffset((prev) => Math.min(prev + 1, maxOffset));
            scheduleTask(loadItems);
          }
        };
        loadItems();
      }
    });
  }

  const items = createMemo(() => (
    Array.isArray(props.each) ? props.each.slice(0, offset()) : [])
  );

  const updateOffset = () => {
    const maxOffset = props.each ? props.each.length : 0;
    if (offset() >= maxOffset) return;

    if (!props.delay) {
      setOffset((prev) => Math.min(prev + 1, maxOffset));
      return;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
      //Moving faster than the delay so need to go sync
      setOffset((prev) => Math.min(prev + 1, maxOffset));
    }

    timeoutId = setTimeout(() => {
      setOffset((prev) => Math.min(prev + 1, maxOffset));
      timeoutId = null;
    }, props.delay ?? 0);
  };

  const handler = keyHandler(updateOffset);

  return (
    <Show when={items()} fallback={props.fallback}>
      <Dynamic component={component} {...props} {/* @once */ ...handler}>
        <Index each={items()} children={props.children} />
      </Dynamic>
    </Show>
  );
}

export function LazyRow<T extends readonly any[]>(props: LazyProps<T>) {
  return createLazy(Row, props, (updateOffset) => ({ onRight: updateOffset }));
}

export function LazyColumn<T extends readonly any[]>(props: LazyProps<T>) {
  return createLazy(Column, props, (updateOffset) => ({ onDown: updateOffset }));
}
