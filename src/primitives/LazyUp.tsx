import {
  Index,
  createEffect,
  createMemo,
  createSignal,
  splitProps,
  Show,
  type JSX,
  type ValidComponent,
} from 'solid-js';
import { Dynamic, type ElementNode } from '@lightningtv/solid';

export function LazyUp<T extends readonly any[], U extends JSX.Element>(
  props: T &
    ElementNode & {
      each: T | undefined | null | false;
      fallback?: JSX.Element;
      container?: JSX.Element;
      component?: ValidComponent;
      direction?: 'row' | 'column';
      upCount: number;
      children: (item: T[number], index: number) => U;
    },
) {
  const [p, others] = splitProps(props, [
    'component',
    'each',
    'fallback',
    'children',
  ]);

  const [offset, setOffset] = createSignal(0);

  createEffect(() => {
    setOffset(props.selected || 0);
  });

  const items = createMemo(() => {
    if (p.each) {
      return p.each.slice(0, props.upCount + offset());
    }
  });

  console.log('LazyUp is deprecated. Please use LazyRow or LazyColumn instead.');

  const isRow = createMemo(() => {
    return (
      others.direction !== undefined && others.direction === 'row' ||
      others.style?.flexDirection === 'row' ||
      others.flexDirection === 'row'
    );
  });

  const keyHandlers = createMemo(() => {
    const updateOffset = () => {
      setOffset(
        (prev) => p.each && Math.min(prev + 1, p.each.length - props.upCount),
      );
    };

    return isRow() ? { onRight: updateOffset } : { onDown: updateOffset };
  });

  return (
    <Show when={items()}>
      <Dynamic component={p.component} {...others} {...keyHandlers()}>
        <Index each={items()} fallback={p.fallback} children={p.children} />
      </Dynamic>
    </Show>
  );
}
