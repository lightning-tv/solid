import * as s from 'solid-js';
import * as lng from '@lightningtv/solid';
import * as lngp from '@lightningtv/solid/primitives';
import { List } from '@solid-primitives/list';
import * as utils from '../utils.js';

const rowOnLeft = lngp.handleNavigation('left');
const rowOnRight = lngp.handleNavigation('right');
const rowScroll = lngp.withScrolling(true);

const rowStyles: lng.NodeStyles = {
  display: 'flex',
  gap: 30,
  transition: {
    x: {
      duration: 250,
      easing: 'ease-out',
    },
  },
};

function scrollToIndex(this: lng.ElementNode, index: number) {
  this.selected = index;
  rowScroll(index, this);
  this.setFocus();
}

export type VirtualRowProps<T> = lng.NewOmit<lngp.RowProps, 'children'> & {
  each: readonly T[] | undefined | null | false;
  displaySize: number;
  bufferSize?: number;
  fallback?: s.JSX.Element;
  children: (item: s.Accessor<T>, index: s.Accessor<number>) => s.JSX.Element;
};

export function VirtualRow<T>(props: VirtualRowProps<T>): s.JSX.Element {

  const [ cursor, setCursor ] = s.createSignal(props.selected ?? 0);

  const bufferSize = () => props.bufferSize ?? 2;

  const items = s.createMemo(() => props.each || []);

  const start = () =>
    utils.clamp(cursor() - bufferSize(), 0, Math.max(0, items().length - props.displaySize - bufferSize()));

  const end = () =>
    Math.min(items().length, cursor() + props.displaySize + bufferSize());

  const [ slice, setSlice ] = s.createSignal(items().slice(start(), end()));

  s.createEffect(s.on([ () => props.selected, items ], ([selected]) => {
    if (!viewRef || !selected) return;

    const item = items()![selected];
    let active = viewRef.children.find(x => x.item === item);
    const lastSelected = viewRef.selected;

    if (active instanceof lng.ElementNode) {
      viewRef.selected = viewRef.children.indexOf(active);
      chainedOnSelectedChanged.call(viewRef, viewRef.selected, viewRef, active, lastSelected);
    }
    else {
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

  const onSelectedChanged: lngp.OnSelectedChanged = function (
    _idx, elm, active, _lastIdx,
  ) {
    let idx = _idx;
    let lastIdx = _lastIdx;

    if (idx === lastIdx) return;

    const prevChildX = this.x + active.x;
    const prevStart = start();

    // Update the displayed slice of items
    setCursor(prevStart + idx);
    setSlice(items().slice(start(), end()));

    // this.selected is relative to the slice
    // and it doesn't get corrected automatically after children change
    const idxCorrection = prevStart - start();
    if (lastIdx) lastIdx += idxCorrection;
    idx += idxCorrection;
    this.selected += idxCorrection;

    // Microtask & this.updateLayout() to make sure the child position is recalculated
    queueMicrotask(() => {
      this.updateLayout();

      // Correct this.x for changes to children, bypass animation
      this.lng.x = prevChildX - active.x;

      // smoothly scroll to new selected element
      rowScroll(idx, elm, active, lastIdx);
    });
  };

  const chainedOnSelectedChanged = lngp.chainFunctions(props.onSelectedChanged, onSelectedChanged)!;

  let viewRef!: lngp.NavigableElement;
  return <view
      {...props}
      scroll='always' // only supporting always scroll at the moment
      ref={lngp.chainRefs(el => { viewRef = el as lngp.NavigableElement; }, props.ref)}
      selected={props.selected || 0}
      cursor={cursor()}
      onLeft={/* @once */ lngp.chainFunctions(props.onLeft, rowOnLeft)}
      onRight={/* @once */ lngp.chainFunctions(props.onRight, rowOnRight)}
      forwardFocus={/* @once */ lngp.navigableForwardFocus}
      scrollToIndex={scrollToIndex}
      onCreate={/* @once */
        props.selected ? lngp.chainFunctions(props.onCreate, rowScroll) : props.onCreate
      }
      /* lngp.NavigableElement.onSelectedChanged is used by lngp.handleNavigation */
      onSelectedChanged={chainedOnSelectedChanged}
      style={/* @once */ lng.combineStyles(props.style, rowStyles)}
    >
      <List each={slice()}>{props.children}</List>
    </view>;
}
