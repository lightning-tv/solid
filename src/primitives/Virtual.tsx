import * as s from 'solid-js';
import * as lng from '@lightningtv/solid';
import * as lngp from '@lightningtv/solid/primitives';
import { List } from '@solid-primitives/list';
import * as utils from '../utils.js';

export type VirtualProps<T> = lng.NewOmit<lngp.RowProps, 'children'> & {
  each: readonly T[] | undefined | null | false;
  displaySize: number;
  bufferSize?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  fallback?: s.JSX.Element;
  children: (item: s.Accessor<T>, index: s.Accessor<number>) => s.JSX.Element;
};

function createVirtual<T>(
  component: typeof lngp.Row | typeof lngp.Column,
  props: VirtualProps<T>,
  scrollFn: ReturnType<typeof lngp.withScrolling>,
  keyHandlers: Record<string, lng.KeyHandler>
) {
  const [cursor, setCursor] = s.createSignal(props.selected ?? 0);
  const bufferSize = s.createMemo(() => props.bufferSize || 2);
  const items = s.createMemo(() => props.each || []);

  const start = () =>
    utils.clamp(cursor() - bufferSize(), 0, Math.max(0, items().length - props.displaySize - bufferSize()));

  const end = () =>
    Math.min(items().length, cursor() + props.displaySize + bufferSize());

  const [slice, setSlice] = s.createSignal(items().slice(start(), end()));

  let viewRef!: lngp.NavigableElement;

  function scrollToIndex(this: lng.ElementNode, index: number) {
    this.selected = index;
    scrollFn(index, this);
    this.setFocus();
  }

  const onSelectedChanged: lngp.OnSelectedChanged = function (_idx, elm, active, _lastIdx) {
    let idx = _idx;
    let lastIdx = _lastIdx;

    if (idx === lastIdx) return;

    const prevChildPos = component === lngp.Row
      ? this.x + active.x
      : this.y + active.y;

    const prevStart = start();

    setCursor(prevStart + idx);
    setSlice(items().slice(start(), end()));

    const idxCorrection = prevStart - start();
    if (lastIdx) lastIdx += idxCorrection;
    idx += idxCorrection;
    this.selected += idxCorrection;

    if (props.onEndReachedThreshold !== undefined && cursor() >= items().length - props.onEndReachedThreshold) {
      props.onEndReached?.();
    }

    queueMicrotask(() => {
      this.updateLayout();

      if (component === lngp.Row) {
        this.lng.x = prevChildPos - active.x;
      } else {
        this.lng.y = prevChildPos - active.y;
      }

      scrollFn(idx, elm, active, lastIdx);
    });
  };

  const chainedOnSelectedChanged = lngp.chainFunctions(props.onSelectedChanged, onSelectedChanged)!;

  s.createEffect(s.on([() => props.selected, items], ([selected]) => {
    if (!viewRef || selected == null) return;
    const item = items()![selected];
    let active = viewRef.children.find(x => x.item === item);
    const lastSelected = viewRef.selected;

    if (active instanceof lng.ElementNode) {
      viewRef.selected = viewRef.children.indexOf(active);
      chainedOnSelectedChanged.call(viewRef, viewRef.selected, viewRef, active, lastSelected);
    } else {
      setCursor(selected);
      setSlice(items().slice(start(), end()));
      queueMicrotask(() => {
        viewRef.updateLayout();
        active = viewRef.children.find(x => x.item === item);
        if (active instanceof lng.ElementNode) {
          viewRef.selected = viewRef.children.indexOf(active);
          chainedOnSelectedChanged.call(viewRef, viewRef.selected, viewRef, active, lastSelected);
        }
      });
    }
  }));

  s.createEffect(s.on(items, () => {
    if (!viewRef) return;
    setSlice(items().slice(start(), end()));
  }, { defer: true }));

  return (<view
    {...props}
    scroll={props.scroll || 'always'}
    ref={lngp.chainRefs(el => { viewRef = el as lngp.NavigableElement; }, props.ref)}
    selected={props.selected || 0}
    cursor={cursor()}
    {/* @once */ ...keyHandlers}
    forwardFocus={/* @once */ lngp.navigableForwardFocus}
    scrollToIndex={/* @once */ scrollToIndex}
    onCreate={/* @once */
      props.selected
        ? lngp.chainFunctions(props.onCreate, scrollFn)
        : props.onCreate
    }
    onSelectedChanged={/* @once */ chainedOnSelectedChanged}
    style={/* @once */ lng.combineStyles(
      props.style,
      component === lngp.Row
        ? {
            display: 'flex',
            gap: 30,
            transition: { x: { duration: 250, easing: 'ease-out' } },
          }
        : {
            display: 'flex',
            flexDirection: 'column',
            gap: 30,
            transition: { y: { duration: 250, easing: 'ease-out' } },
          }
    )}
  >
    <List each={slice()}>{props.children}</List>
  </view>
);
}


export function VirtualRow<T>(props: VirtualProps<T>) {
  return createVirtual(lngp.Row, props, lngp.withScrolling(true), {
    onLeft: lngp.navigableHandleNavigation,
    onRight: lngp.navigableHandleNavigation,
  });
}

export function VirtualColumn<T>(props: VirtualProps<T>) {
  return createVirtual(lngp.Column, props, lngp.withScrolling(false), {
    onUp: lngp.navigableHandleNavigation,
    onDown: lngp.navigableHandleNavigation,
  });
}
