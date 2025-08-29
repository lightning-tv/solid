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
  debugInfo?: boolean;
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
  const scrollIndex = s.createMemo(() => props.scrollIndex || 0);
  const items = s.createMemo(() => props.each || []);
  const itemCount = s.createMemo(() => items().length);
  const scrollType = s.createMemo(() => props.scroll || 'auto');

  const selected = () => {
    if (props.wrap) {
      return Math.max(bufferSize(), scrollIndex());
    }
    return props.selected || 0;
  };

  type SliceState = { start: number; slice: T[]; selected: number, delta: number };
    const [slice, setSlice] = s.createSignal<SliceState>({
      start: 0,
      slice: [],
      selected: 0,
      delta: 0
    });

    function normalizeDeltaForWindow(delta: number, windowLen: number): number {
      if (!windowLen) return 0;
      const half = windowLen / 2;
      if (delta > half) return delta - windowLen;
      if (delta < -half) return delta + windowLen;
      return delta;
    }

    function computeSlice(c: number, delta: number, prev: SliceState): SliceState {
      const total = itemCount();
      if (total === 0) return { start: 0, slice: [], selected: 0, delta };

      let start = prev.start;
      let selected = prev.selected;
      const length = props.displaySize + bufferSize();

      switch (scrollType()) {
        case 'always':
          if (props.wrap) {
            start = utils.mod(c - 1, total);
            selected = 1;
          } else {
            start = utils.clamp(
              c - bufferSize(),
              0,
              Math.max(0, total - props.displaySize - bufferSize()),
            );
            selected =
              c < bufferSize()
                ? c
                : c >= total - props.displaySize
                ? c - (total - props.displaySize) + bufferSize()
                : bufferSize();
          }
          break;

        case 'auto':
          if (props.wrap) {
            start = utils.mod(c - 1, total);
            selected = 1;
          } else {
            const scrollOffset = Math.max(bufferSize(), scrollIndex());
            const maxStart = Math.max(0, total - props.displaySize - bufferSize());

            if (delta < 0) { // moving left
              start = utils.clamp(
                c - (props.displaySize - scrollOffset),
                0,
                maxStart
              );
            } else { // moving right or stationary
              start = utils.clamp(
                c - scrollOffset,
                0,
                maxStart
              );
            }
            selected = c - start;
          }
          break;

        case 'edge':
          const startScrolling = Math.max(1, props.displaySize - 1);
          if (props.wrap) {
            if (delta > 0) {
              if (prev.selected < startScrolling) {
                selected = prev.selected + 1;
              } else {
                start = utils.mod(prev.start + 1, total);
                selected = startScrolling;
              }
            } else if (delta < 0) {
              if (prev.selected > 1) {
                selected = prev.selected - 1;
              } else {
                start = utils.mod(prev.start - 1, total);
                selected = 1;
              }
            } else {
              start = utils.mod(c - 1, total);
              selected = 1;
            }
          } else {
            if (c < startScrolling && prev.start === 0) {
              start = 0;
              selected = c;
            } else if (c >= total - bufferSize()) {
              start = Math.max(0, total - props.displaySize);
              selected = c - start;
            } else if (delta > 0) {
              start = c - startScrolling + 1;
              selected = startScrolling - 1;
            } else if (c > total - props.displaySize + 1) {
              start = Math.max(0, total - props.displaySize);
              selected = c - start;
            } else {
              start = Math.max(0, c - 1);
              selected = 1;
            }
          }
          break;

        case 'none':
        default:
          start = 0;
          selected = c;
          break;
      }

      let newSlice = prev.slice;
      if (start !== prev.start || newSlice.length === 0) {
        newSlice = props.wrap
          ? Array.from(
              { length },
              (_, i) => items()[utils.mod(start + i, total)],
            ) as T[]
          : items().slice(start, start + length);
      }

      const state: SliceState = { start, slice: newSlice, selected, delta };

      if (props.debugInfo) {
        console.log(`[Virtual]`, {
          cursor: c,
          delta,
          start,
          selected,
          slice: newSlice.map((_, i) => utils.mod(start + i, total)),
        });
      }

      return state;
    }

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

  const onSelectedChanged: lngp.OnSelectedChanged = function (_idx, elm, _active, _lastIdx) {
    let idx = _idx;
    let lastIdx = _lastIdx || 0;
    let active = _active;
    const initialRun = idx === lastIdx;
    const total = itemCount();
    const isRow = component === lngp.Row;
    const axis = isRow ? 'x' : 'y';

    if (initialRun) {
      if (props.wrap) {
        elm.offset = elm[axis];
      } else {
        return;
      }
    }

    const rawDelta = idx - (lastIdx ?? 0);
    const windowLen =
          elm?.children?.length ?? props.displaySize + bufferSize();
    const delta = props.wrap
          ? normalizeDeltaForWindow(rawDelta, windowLen)
          : rawDelta;

    if (!initialRun) {
      setCursor(c => {
        const next = c + delta;
        return props.wrap
          ? utils.mod(next, total)
          : utils.clamp(next, 0, total - 1);
      });

      const newState = computeSlice(cursor(), delta, slice());
      setSlice(newState);
      elm.selected = newState.selected;

      if (
        props.onEndReachedThreshold !== undefined &&
        cursor() >= items().length - props.onEndReachedThreshold
      ) {
        props.onEndReached?.();
      }
    }

    const prevChildPos = this[axis] + active[axis];

    queueMicrotask(() => {
      this.updateLayout();
      this.lng[axis] = this._targetPosition = prevChildPos - active[axis];

      scrollFn(slice().selected, elm, active, slice().selected - slice().delta);
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
      const newState = computeSlice(cursor(), 0, slice());
      setSlice(newState);
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
    const newState = computeSlice(cursor(), 0, slice());
    setSlice(newState);
    viewRef.selected = newState.selected;
  }));

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
      <List each={slice().slice}>{props.children}</List>
    </view>
  );
}

export function VirtualRow<T>(props: VirtualProps<T>) {
  return createVirtual(lngp.Row, props, props.doScroll || lngp.scrollRow, {
    onLeft: lngp.chainFunctions(props.onLeft, lngp.handleNavigation('left')) as lng.KeyHandler,
    onRight: lngp.chainFunctions(props.onRight, lngp.handleNavigation('right')) as lng.KeyHandler,
  });
}

export function VirtualColumn<T>(props: VirtualProps<T>) {
  return createVirtual(lngp.Column, props, props.doScroll || lngp.scrollColumn, {
    onUp: lngp.chainFunctions(props.onUp, lngp.handleNavigation('up')) as lng.KeyHandler,
    onDown: lngp.chainFunctions(props.onDown, lngp.handleNavigation('down')) as lng.KeyHandler,
  });
}
