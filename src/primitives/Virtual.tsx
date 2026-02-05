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
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  debugInfo?: boolean;
  factorScale?: boolean;
  uniformSize?: boolean;
  children: (item: s.Accessor<T>, index: s.Accessor<number>) => s.JSX.Element;
};

function createVirtual<T>(
  component: typeof lngp.Row | typeof lngp.Column,
  props: VirtualProps<T>,
  keyHandlers: Record<string, lng.KeyHandler>,
) {
  const isRow = component === lngp.Row;
  const axis = isRow ? 'x' : 'y';
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

  let cachedScaledSize: number | undefined;
  let targetPosition: number | undefined;
  let cachedAnimationController: lng.IAnimationController | undefined;
  const uniformSize = s.createMemo(() => {
    return props.uniformSize !== false;
  });

  type SliceState = {
    start: number;
    slice: T[];
    selected: number;
    delta: number;
    shiftBy: number;
    atStart: boolean;
    cursor: number;
  };
  const [slice, setSlice] = s.createSignal<SliceState>({
    start: 0,
    slice: [],
    selected: 0,
    delta: 0,
    shiftBy: 0,
    atStart: true,
    cursor: 0,
  });

  function normalizeDeltaForWindow(delta: number, windowLen: number): number {
    if (!windowLen) return 0;
    const half = windowLen / 2;
    if (delta > half) return delta - windowLen;
    if (delta < -half) return delta + windowLen;
    return delta;
  }

  function computeSize(selected: number = 0) {
    if (uniformSize() && cachedScaledSize) {
      return cachedScaledSize;
    } else if (viewRef) {
      const gap = viewRef.gap || 0;
      const dimension = isRow ? 'width' : 'height'; // This can't be moved up as it depends on viewRef
      const prevSelectedChild = viewRef.children[selected];

      if (prevSelectedChild instanceof lng.ElementNode) {
        const itemSize = prevSelectedChild[dimension] || 0;
        const focusStyle = prevSelectedChild.style?.focus as lng.NodeStyles;
        const scale = focusStyle?.scale ?? prevSelectedChild.scale ?? 1;
        const scaledSize = itemSize * (props.factorScale ? scale : 1) + gap;
        cachedScaledSize = scaledSize;
        return scaledSize;
      }
    }
    return 0;
  }

  function computeSlice(
    c: number,
    delta: number,
    prev: SliceState,
  ): SliceState {
    const total = itemCount();
    if (total === 0)
      return {
        start: 0,
        slice: [],
        selected: 0,
        delta,
        shiftBy: 0,
        atStart: true,
        cursor: 0,
      };

    const length = props.displaySize + bufferSize();
    let start = prev.start;
    let selected = prev.selected;
    let atStart = prev.atStart;
    let shiftBy = -delta;

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
          if (delta === 0 && c > 3) {
            shiftBy = c < 3 ? -c : -2;
            selected = 2;
          } else {
            selected =
              c < bufferSize()
                ? c
                : c >= total - props.displaySize
                  ? c - (total - props.displaySize) + bufferSize()
                  : bufferSize();
          }
        }
        break;

      case 'auto':
        if (props.wrap) {
          if (delta === 0) {
            selected = scrollIndex() || 1;
            start = utils.mod(c - (scrollIndex() || 1), total);
          } else {
            start = utils.mod(c - (prev.selected || 1), total);
          }
        } else {
          if (delta < 0) {
            // Moving left
            if (prev.start > 0 && prev.selected >= props.displaySize) {
              // Move selection left inside slice
              start = prev.start;
              selected = prev.selected - 1;
            } else if (prev.start > 0) {
              // Move selection left inside slice
              start = prev.start - 1;
              selected = prev.selected;
              // shiftBy = 0;
            } else if (prev.start === 0 && !prev.atStart) {
              start = 0;
              selected = prev.selected - 1;
              atStart = true;
            } else if (selected >= props.displaySize - 1) {
              // Shift window left, keep selection pinned
              start = 0;
              selected = prev.selected - 1;
            } else {
              start = 0;
              selected = prev.selected - 1;
              shiftBy = 0;
            }
          } else if (delta > 0) {
            // Moving right
            if (prev.selected < scrollIndex()) {
              // Move selection right inside slice
              start = prev.start;
              selected = prev.selected + 1;
              shiftBy = 0;
            } else if (prev.selected === scrollIndex() || atStart) {
              start = prev.start;
              selected = prev.selected + 1;
              atStart = false;
            } else if (prev.start === 0 && prev.selected === 0) {
              start = 0;
              selected = 1;
              atStart = false;
            } else if (prev.start >= total - props.displaySize) {
              // At end: clamp slice, selection drifts right
              start = prev.start;
              selected = c - start;
              shiftBy = 0;
            } else {
              // Shift window right, keep selection pinned
              start = prev.start + 1;
              selected = Math.max(prev.selected, scrollIndex() + 1);
            }
          } else {
            // Initial setup
            if (c > 0) {
              start = Math.min(
                c - (scrollIndex() || 1),
                total - props.displaySize - bufferSize(),
              );
              selected = Math.max(scrollIndex() || 1, c - start);
              shiftBy = total - c < 3 ? c - total : -1;
              atStart = false;
            } else {
              // ScrollToIndex was called
              if (c !== prev.cursor) {
                start = c;
                if (c === 0) {
                  atStart = true;
                  selected = 0;
                }
              } else {
                start = prev.start;
                selected = prev.selected;
              }
            }
          }
        }
        break;

      case 'edge':
        const startScrolling = Math.max(
          1,
          props.displaySize + (atStart ? -1 : 0),
        );
        if (props.wrap) {
          if (delta > 0) {
            if (prev.selected < startScrolling) {
              selected = prev.selected + 1;
              shiftBy = 0;
            } else if (prev.selected === startScrolling && atStart) {
              selected = prev.selected + 1;
              atStart = false;
            } else {
              start = utils.mod(prev.start + 1, total);
              selected = prev.selected;
            }
          } else if (delta < 0) {
            if (prev.selected > 1) {
              selected = prev.selected - 1;
              shiftBy = 0;
            } else {
              start = utils.mod(prev.start - 1, total);
              selected = 1;
            }
          } else {
            start = utils.mod(c - 1, total);
            selected = 1;
            shiftBy = -1;
            atStart = false;
          }
        } else {
          if (delta === 0 && c > 0) {
            //initial setup
            selected = c > startScrolling ? startScrolling : c;
            start = Math.max(0, c - startScrolling + 1);
            shiftBy = c > startScrolling ? -1 : 0;
            atStart = c < startScrolling;
          } else if (delta > 0) {
            if (prev.selected < startScrolling) {
              selected = prev.selected + 1;
              shiftBy = 0;
            } else if (prev.selected === startScrolling && atStart) {
              selected = prev.selected + 1;
              atStart = false;
            } else {
              start = prev.start + 1;
              selected = prev.selected;
              atStart = false;
            }
          } else if (delta < 0) {
            if (prev.selected > 1) {
              selected = prev.selected - 1;
              shiftBy = 0;
            } else if (c > 1) {
              start = Math.max(0, c - 1);
              selected = 1;
            } else if (c === 1) {
              start = 0;
              selected = 1;
            } else {
              start = 0;
              selected = 0;
              shiftBy = atStart ? 0 : shiftBy;
              atStart = true;
            }
          }
        }
        break;

      case 'none':
      default:
        start = 0;
        selected = c;
        shiftBy = 0;
        break;
    }

    let newSlice = prev.slice;
    if (start !== prev.start || newSlice.length === 0) {
      newSlice = props.wrap
        ? (Array.from(
            { length },
            (_, i) => items()[utils.mod(start + i, total)],
          ) as T[])
        : items().slice(start, start + length);
    }

    const state: SliceState = {
      start,
      slice: newSlice,
      selected,
      delta,
      shiftBy,
      atStart,
      cursor: c,
    };

    if (props.debugInfo) {
      console.log(`[Virtual]`, {
        cursor: c,
        delta,
        start,
        selected,
        shiftBy,
        slice: state.slice,
      });
    }

    return state;
  }

  let viewRef!: lngp.NavigableElement;

  function scrollToIndex(this: lng.ElementNode, index: number) {
    s.untrack(() => {
      if (itemCount() === 0) return;

      lastNavTime = performance.now();
      if (originalPosition !== undefined) {
        viewRef.lng[axis] = originalPosition;
        targetPosition = originalPosition;
      }

      if (!lng.hasFocus(viewRef)) {
        // force focus as scrollToIndex is manually called
        viewRef.setFocus();
      }

      updateSelected([utils.clamp(index, 0, itemCount() - 1)]);
    });
  }

  let lastNavTime = 0;
  function getAdaptiveDuration(duration: number = 250) {
    const now = performance.now();
    const delta = now - lastNavTime;
    lastNavTime = now;
    if (delta < duration) return delta;
    return duration;
  }

  let originalPosition: number | undefined;
  const onSelectedChanged: lngp.OnSelectedChanged = function (
    _idx,
    elm,
    _active,
    _lastIdx,
  ) {
    let idx = _idx;
    let lastIdx = _lastIdx || 0;
    let active = _active;
    const noChange = idx === lastIdx;
    const total = itemCount();
    originalPosition = originalPosition ?? elm[axis];

    if (props.onSelectedChanged) {
      props.onSelectedChanged.call(
        this as lngp.NavigableElement,
        idx,
        this as lngp.NavigableElement,
        active,
        lastIdx,
      );
    }

    if (noChange) return;

    const rawDelta = idx - (lastIdx ?? 0);
    const windowLen = elm?.children?.length ?? props.displaySize + bufferSize();
    const delta = props.wrap
      ? normalizeDeltaForWindow(rawDelta, windowLen)
      : rawDelta;

    setCursor((c) => {
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
      cursor() >= itemCount() - props.onEndReachedThreshold
    ) {
      props.onEndReached?.();
    }

    if (newState.shiftBy === 0) return;

    const prevChildPos = (targetPosition ?? this[axis]) + active[axis];

    queueMicrotask(() => {
      elm.updateLayout();
      const childSize = computeSize(slice().selected);

      if (
        cachedAnimationController &&
        cachedAnimationController.state === 'running'
      ) {
        cachedAnimationController.stop();
      }

      if (lng.Config.animationsEnabled) {
        this.lng[axis] = prevChildPos - active[axis];
        targetPosition = this.lng[axis] + childSize * slice().shiftBy;
        cachedAnimationController = this.animate(
          { [axis]: targetPosition },
          {
            ...this.animationSettings,
            duration: getAdaptiveDuration(this.animationSettings?.duration),
          },
        ).start();
      } else {
        this.lng[axis] = this.lng[axis]! + childSize * slice().shiftBy;
      }
    });
  };

  const updateSelected = ([sel, _items]: [number?, any?]) => {
    if (!viewRef || sel === undefined || itemCount() === 0) return;
    const item = items()[sel];
    setCursor(sel);
    const newState = computeSlice(cursor(), 0, slice());
    setSlice(newState);

    queueMicrotask(() => {
      viewRef.updateLayout();
      let activeIndex = viewRef.children.findIndex((x) => x.item === item);
      if (activeIndex === -1) return;
      viewRef.selected = activeIndex;
      if (lng.hasFocus(viewRef)) {
        viewRef.children[activeIndex]?.setFocus();
      }

      if (newState.shiftBy === 0) return;

      const childSize = computeSize(slice().selected);
      // Original Position is offset to support scrollToIndex
      originalPosition = originalPosition ?? viewRef.lng[axis];
      targetPosition = targetPosition ?? viewRef.lng[axis];

      viewRef.lng[axis] = (viewRef.lng[axis] || 0) + childSize * -1;
    });
  };

  let doOnce = false;
  s.createEffect(
    s.on([() => props.wrap, items], () => {
      if (!viewRef || itemCount() === 0 || !props.wrap || doOnce) return;
      doOnce = true;
      // offset just for wrap so we keep one item before
      queueMicrotask(() => {
        const childSize = computeSize(slice().selected);
        viewRef.lng[axis] = (viewRef.lng[axis] || 0) + childSize * -1;
        // Original Position is offset to support scrollToIndex
        originalPosition = viewRef.lng[axis];
        targetPosition = viewRef.lng[axis];
      });
    }),
  );

  s.createEffect(s.on([() => props.selected, items], updateSelected));

  s.createEffect(
    s.on(items, () => {
      if (!viewRef) return;
      if (cursor() >= itemCount()) {
        setCursor(Math.max(0, itemCount() - 1));
      }
      const newState = computeSlice(cursor(), 0, slice());
      setSlice(newState);
      viewRef.selected = newState.selected;
    }),
  );

  return (
    <view
      {...props}
      {...keyHandlers}
      ref={lngp.chainRefs((el) => {
        viewRef = el as lngp.NavigableElement;
      }, props.ref)}
      selected={selected()}
      cursor={cursor()}
      forwardFocus={/* @once */ lngp.navigableForwardFocus}
      scrollToIndex={/* @once */ scrollToIndex}
      onSelectedChanged={/* @once */ onSelectedChanged}
      style={
        /* @once */ lng.combineStyles(
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
              },
        )
      }
    >
      <List each={slice().slice}>{props.children}</List>
    </view>
  );
}

export function VirtualRow<T>(props: VirtualProps<T>) {
  return createVirtual(lngp.Row, props, {
    onLeft: lngp.chainFunctions(
      props.onLeft,
      lngp.handleNavigation('left'),
    ) as lng.KeyHandler,
    onRight: lngp.chainFunctions(
      props.onRight,
      lngp.handleNavigation('right'),
    ) as lng.KeyHandler,
  });
}

export function VirtualColumn<T>(props: VirtualProps<T>) {
  return createVirtual(lngp.Column, props, {
    onUp: lngp.chainFunctions(
      props.onUp,
      lngp.handleNavigation('up'),
    ) as lng.KeyHandler,
    onDown: lngp.chainFunctions(
      props.onDown,
      lngp.handleNavigation('down'),
    ) as lng.KeyHandler,
  });
}
