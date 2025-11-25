import * as lng from '@lightningtv/solid';
import * as lngp from '@lightningtv/solid/primitives';
import * as s from 'solid-js';

type LazyProps<T extends readonly any[]> = lng.NewOmit<lng.NodeProps, 'children'> & {
  each: T | undefined | null | false;
  upCount: number;
  buffer?: number;
  delay?: number;
  sync?: boolean;
  eagerLoad?: boolean;
  children: (item: s.Accessor<T[number]>, index: number) => s.JSX.Element;
};

function createLazy<T>(
  component: s.ValidComponent,
  props: LazyProps<readonly T[]>,
  keyHandler: (updateOffset: (event: KeyboardEvent, container: lng.ElementNode) => void) => Record<string, (event: KeyboardEvent, container: lng.ElementNode) => void>
) {
  // Need at least one item so it can be focused
  const [offset, setOffset] = s.createSignal<number>(props.sync ? props.upCount : 0);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let viewRef!: lngp.NavigableElement;

  const buffer = s.createMemo(() => {
    if (typeof props.buffer === 'number') {
      return props.buffer;
    }
    const scroll = props.scroll || props.style?.scroll;
    if (
      !scroll ||
      scroll === 'auto' ||
      scroll === 'always' ||
      scroll === 'bounded'
    )
      return props.upCount + 1;
    if (scroll === 'center') return Math.ceil(props.upCount / 2) + 1;
    return 2;
  });

  s.createRenderEffect(() => setOffset(offset => Math.max(offset, (props.selected || 0) + buffer())));

  if (!props.sync || props.eagerLoad) {
    s.createEffect(() => {
      if (props.each) {
        const loadItems = () => {
          let count = s.untrack(offset);
          if (count < props.upCount) {
            setOffset(count + 1);
            timeoutId = setTimeout(loadItems, 16); // ~60fps
            count++;
          } else if (props.eagerLoad) {
            const maxOffset = props.each ? props.each.length : 0;
            if (count >= maxOffset) return;
            setOffset((prev) => Math.min(prev + 1, maxOffset));
            lng.scheduleTask(loadItems);
          }
        };
        loadItems();
      }
    });
  }

  const items: s.Accessor<T[]> = s.createMemo(() => (
    Array.isArray(props.each) ? props.each.slice(0, offset()) : [])
  );

  function lazyScrollToIndex(this: lngp.NavigableElement, index: number) {
    setOffset(Math.max(index, 0) + buffer())
    queueMicrotask(() => viewRef.scrollToIndex(index));
  }

  function isInNonScrollableZone(
    this: lngp.NavigableElement,
    element?: lng.ElementNode,
  ): boolean {
    if (!viewRef) {
      return false;
    }
    const scroll = props.scroll || viewRef.scroll;
    if (scroll !== 'bounded') {
      return false;
    }
    const upCount = props.upCount;
    const totalItems = props.each ? props.each.length : 0;
    if (totalItems === 0) {
      return false;
    }
    const nonScrollableZoneStart = Math.max(0, totalItems - upCount);
    if (element) {
      const elementIndex = viewRef.children.indexOf(element);
      if (elementIndex === -1) return false;
      return elementIndex >= nonScrollableZoneStart;
    }
    const selected = viewRef.selected ?? 0;
    return selected >= nonScrollableZoneStart;
  }

  const updateOffset = (_event: KeyboardEvent, container: lng.ElementNode) => {
    const maxOffset = props.each ? props.each.length : 0;
    const selected = container.selected || 0;
    const numChildren = container.children.length;
    if (offset() >= maxOffset || selected < numChildren - buffer()) return;

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
    <lng.Dynamic
      {...props}
      component={component}
      upCount={props.upCount}
      {/* @once */ ...handler}
      lazyScrollToIndex={lazyScrollToIndex}
      isInNonScrollableZone={isInNonScrollableZone}
      ref={lngp.chainRefs(el => { viewRef = el as lngp.NavigableElement; }, props.ref)} >
      <s.Index each={items()} children={props.children} />
    </lng.Dynamic>
  );
}

export function LazyRow<T extends readonly any[]>(props: LazyProps<T>) {
  return createLazy(lngp.Row, props, (updateOffset) => ({ onRight: updateOffset }));
}

export function LazyColumn<T extends readonly any[]>(props: LazyProps<T>) {
  return createLazy(lngp.Column, props, (updateOffset) => ({ onDown: updateOffset }));
}
