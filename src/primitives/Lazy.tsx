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
} from 'solid-js';
import { Dynamic, type NewOmit, scheduleTask, type NodeProps } from '@lightningtv/solid';
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
  const [offset, setOffset] = createSignal(1);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => setOffset(props.selected || 1));

  if (props.sync) {
    setOffset(props.upCount);
  } else {
    createEffect(() => {
      if (props.each) {
        let count = untrack(offset);

        const loadItems = () => {
          if (count < props.upCount) {
            setOffset(count + 1);
            timeoutId = setTimeout(loadItems, 16); // ~60fps
            count++;
          } else if (props.eagerLoad) {
            const maxOffset = props.each ? props.each.length : 0;
            if (offset() > maxOffset) return;
            setOffset((prev) => Math.min(prev + 1, maxOffset));
            scheduleTask(loadItems);
          }
        };
        loadItems();
      }
    });
  }

  const items = createMemo(() => (Array.isArray(props.each) ? props.each.slice(0, offset()) : []));

  const updateOffset = () => {
    const maxOffset = props.each ? props.each.length : 0;
    if (offset() >= maxOffset) return;

    if (timeoutId) clearTimeout(timeoutId);
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
