import * as s from 'solid-js';
import * as lng from '@lightningtv/solid';
import * as lngp from '@lightningtv/solid/primitives';
import { List } from '@solid-primitives/list';
import * as utils from '../utils.js';

export type VirtualProps<T> = lng.NewOmit<lngp.RowProps, 'children'> & {
  each: readonly T[] | undefined | null | false;
  displaySize: number;
  bufferSize?: number;
  wrap?: boolean;
  scrollIndex?: number;
  doScroll?: lngp.Scroller;
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
  const scrollIndex = s.createMemo(() => {
    return props.scrollIndex || 0;
  });
  const items = s.createMemo(() => props.each || []);
  const itemCount = s.createMemo(() => items().length);
  const scrollType = s.createMemo(() => props.scroll || 'auto');

  const selected = () => {
    if (props.wrap) {
      return bufferSize();
    }
    return props.selected || 0;
  };

  const start = () => {
    if (itemCount() === 0) return 0;
    if (props.wrap) {
      return utils.mod(cursor() - bufferSize(), itemCount());
    }
    if (scrollType() === 'always') {
      return Math.min(Math.max(cursor() - bufferSize(), 0), itemCount() - props.displaySize - bufferSize());
    }
    if (scrollType() === 'auto') {
      return utils.clamp(cursor() - Math.max(bufferSize(), scrollIndex()), 0, Math.max(0, itemCount() - props.displaySize - bufferSize()));
    }
    return utils.clamp(cursor() - bufferSize(), 0, Math.max(0, itemCount() - props.displaySize));
  };

  const end = () => {
    if (itemCount() === 0) return 0;
    if (props.wrap) {
      return (start() + props.displaySize + bufferSize()) % itemCount();
    }
    return Math.min(itemCount(), start() + props.displaySize + bufferSize());
  };

  const getSlice = s.createMemo(() => {
    if (itemCount() === 0) return [];
    if (!props.wrap) {
      return items().slice(start(), end());
    }
    // Wrapping slice
    const sIdx = start();
    const eIdx = (sIdx + props.displaySize + bufferSize()) % itemCount();
    if (sIdx < eIdx) {
      return items().slice(sIdx, eIdx);
    }
    return [...items().slice(sIdx), ...items().slice(0, eIdx)];
  });

  const [slice, setSlice] = s.createSignal(getSlice());

  let viewRef!: lngp.NavigableElement;

  function scrollToIndex(this: lng.ElementNode, index: number) {
    if (itemCount() === 0) return;
    let target = index;
    if (props.wrap) {
      target = utils.mod(index, itemCount());
    } else {
      target = utils.clamp(index, 0, itemCount() - 1);
    }
    updateSelected([target]);
  }

  const onSelectedChanged: lngp.OnSelectedChanged = function (_idx, elm, active, _lastIdx) {
    let idx = _idx;
    let lastIdx = _lastIdx || 0;
    const initialRun = idx === lastIdx;

    if (initialRun && !props.wrap) return;

    if (!initialRun) {
      if (props.wrap) {
        setCursor(c => utils.mod(c + idx - lastIdx, itemCount()));
      } else {
        setCursor(c => utils.clamp(c + idx - lastIdx, 0, Math.max(0, itemCount() - 1)));
      }

      setSlice(getSlice());

      const c = cursor();
      const scroll = scrollType();
      if (props.wrap) {
        this.selected = bufferSize();
      } else if (props.scrollIndex) {
        this.selected = Math.min(c, props.scrollIndex);
        if (c >= itemCount() - props.displaySize + bufferSize()) {
          this.selected = c - (itemCount() - props.displaySize) + bufferSize();
        }
      } else if (scroll === 'always' || scroll === 'auto') {
        if (c < bufferSize()) {
          this.selected = c;
        } else if (c >= itemCount() - props.displaySize) {
          this.selected = c - (itemCount() - props.displaySize) + bufferSize();
        } else {
          this.selected = bufferSize();
        }
      }

      if (props.onEndReachedThreshold !== undefined && cursor() >= items().length - props.onEndReachedThreshold) {
        props.onEndReached?.();
      }
    }
    const isRow = component === lngp.Row;
    const prevChildPos = isRow
      ? this.x + active.x
      : this.y + active.y;

    queueMicrotask(() => {
      this.updateLayout();
      // if (this._initialPosition === undefined) {
      //   this.offset = 0;
      //   const axis = isRow ? 'x' : 'y';
      //   this._initialPosition = this[axis];
      // }
      if (component === lngp.Row) {
        this.lng.x = this._targetPosition = prevChildPos - active.x;
      } else {
        this.lng.y = this._targetPosition = prevChildPos - active.y;
      }
      scrollFn(idx, elm, active, lastIdx);
    });
  };

  const chainedOnSelectedChanged = lngp.chainFunctions(props.onSelectedChanged, onSelectedChanged)!;

  const updateSelected = ([selected, _items]: [number?, any?]) => {
    if (!viewRef || selected === undefined) return;
    const sel = selected;
    const item = items()[sel];
    let active = viewRef.children.find(x => x.item === item);
    const lastSelected = viewRef.selected;

    if (active instanceof lng.ElementNode) {
      viewRef.selected = viewRef.children.indexOf(active);
      chainedOnSelectedChanged.call(viewRef, viewRef.selected, viewRef, active, lastSelected);
      active.setFocus();
    } else {
      setCursor(sel);
      setSlice(getSlice());
      queueMicrotask(() => {
        viewRef.updateLayout();
        active = viewRef.children.find(x => x.item === item);
        if (active instanceof lng.ElementNode) {
          viewRef.selected = viewRef.children.indexOf(active);
          chainedOnSelectedChanged.call(viewRef, viewRef.selected, viewRef, active, lastSelected);
        }
      });
    }
  };

  s.createEffect(s.on([() => props.selected, items], updateSelected));

  s.createEffect(s.on(items, () => {
    if (!viewRef) return;
    if (cursor() >= itemCount()) {
      setCursor(Math.max(0, itemCount() - 1));
    }
    setSlice(getSlice());
  }, { defer: true }));

  return (<view
      {...props}
      ref={lngp.chainRefs(el => { viewRef = el as lngp.NavigableElement; }, props.ref)}
      selected={selected()}
      cursor={cursor()}
      {...keyHandlers}
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
  return createVirtual(lngp.Row, props, props.doScroll || lngp.withScrolling(true), {
    onLeft: lngp.chainFunctions(props.onLeft, lngp.navigableHandleNavigation) as lng.KeyHandler,
    onRight: lngp.chainFunctions(props.onRight, lngp.navigableHandleNavigation) as lng.KeyHandler,
  });
}

export function VirtualColumn<T>(props: VirtualProps<T>) {
  return createVirtual(lngp.Column, props, props.doScroll || lngp.withScrolling(false), {
    onUp: lngp.chainFunctions(props.onUp, lngp.navigableHandleNavigation) as lng.KeyHandler,
    onDown: lngp.chainFunctions(props.onDown, lngp.navigableHandleNavigation) as lng.KeyHandler,
  });
}
