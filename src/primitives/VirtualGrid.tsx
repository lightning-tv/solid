import * as s from 'solid-js';
import * as lng from '@lightningtv/solid';
import * as lngp from '@lightningtv/solid/primitives';
import { List } from '@solid-primitives/list';
import * as utils from '../utils.js';

const columnScroll = lngp.withScrolling(false);

const rowStyles: lng.NodeStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  transition: {
    y: true,
  },
};

function scrollToIndex(this: lng.ElementNode, index: number) {
  this.selected = index;
  columnScroll(index, this);
  this.setFocus();
}

export type VirtualGridProps<T> = lng.NewOmit<lngp.RowProps, 'children'> & {
  each: readonly T[] | undefined | null | false;
  columns: number; // items per row
  rows?: number; // number of visible rows (default: 1)
  buffer?: number;
  onEndReached?: () => void;
  children: (item: s.Accessor<T>, index: s.Accessor<number>) => s.JSX.Element;
};

export function VirtualGrid<T>(props: VirtualGridProps<T>): s.JSX.Element {
  const bufferSize = () => props.buffer ?? 2;
  const [ cursor, setCursor ] = s.createSignal(props.selected ?? 0);
  const items = s.createMemo(() => props.each || []);
  const itemsPerRow = () => props.columns;
  const numberOfRows = () => props.rows ?? 1;
  const totalVisibleItems = () => itemsPerRow() * numberOfRows();

  const start = s.createMemo(() => {
    const perRow = itemsPerRow();
    const newRowIndex = Math.floor(cursor() / perRow);

    return utils.clamp(
      newRowIndex * perRow - bufferSize() * perRow,
      0,
      Math.max(0, items().length - totalVisibleItems())
    );
  })

  const end = s.createMemo(() => {
    const perRow = itemsPerRow();
    const newRowIndex = Math.floor(cursor() / perRow);

    return Math.min(
      items().length,
      (newRowIndex + bufferSize()) * perRow + totalVisibleItems()
    );
  })

  const [slice, setSlice] = s.createSignal(items().slice(start(), end()));

  let viewRef!: lngp.NavigableElement;

  const onLeft = lngp.handleNavigation('left');
  const onRight = lngp.handleNavigation('right');

  const onUpDown: lngp.KeyHandler = function () {
    const perRow = itemsPerRow();
    const selected = this.selected || 0;
    if (selected < perRow) return false;

    const newIndex = utils.clamp(selected - perRow, 0, items().length - 1);
    const lastIdx = selected;
    this.selected = newIndex;
    const active = this.children[this.selected];
    if (active instanceof lng.ElementNode) {
      active.setFocus();
      chainedOnSelectedChanged.call(this as lngp.NavigableElement, this.selected, this as lngp.NavigableElement, active, lastIdx);
    }
  };

  const onSelectedChanged: lngp.OnSelectedChanged = function (_idx, elm, active, _lastIdx,) {
    let idx = _idx;
    let lastIdx = _lastIdx;
    const perRow = itemsPerRow();
    const newRowIndex = Math.floor(idx / perRow);
    const prevRowIndex = Math.floor((lastIdx || 0) / perRow);
    const prevStart = start();

    if (newRowIndex === prevRowIndex) return;

    setCursor(prevStart + idx);
    setSlice(items().slice(start(), end()));

    // this.selected is relative to the slice
    // and it doesn't get corrected automatically after children change
    const idxCorrection = prevStart - start();
    if (lastIdx) lastIdx += idxCorrection;
    idx += idxCorrection;
    this.selected += idxCorrection;

    if (cursor() >= items().length - perRow * bufferSize()) {
      props.onEndReached?.();
    }

    queueMicrotask(() => {
      const prevRowY = this.y + active.y;
      this.updateLayout();
      // if (prevRowY > active.y) {
      // }
      this.lng.y = prevRowY - active.y;
      // this.y = prevRowY - active.y;
      columnScroll(idx, elm, active, lastIdx);
    });
  };

  const chainedOnSelectedChanged = lngp.chainFunctions(props.onSelectedChanged, onSelectedChanged)!;

  s.createEffect(
    s.on([() => props.selected, items], ([selected]) => {
      if (!viewRef || selected == null) return;

      const item = items()[selected];
      let active = viewRef.children.find(x => x.item === item);
      const lastSelected = viewRef.selected;

      if (active instanceof lng.ElementNode) {
        viewRef.selected = viewRef.children.indexOf(active);
        chainedOnSelectedChanged.call(viewRef, viewRef.selected, viewRef, active, lastSelected);
      } else {
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
    })
  );

  s.createEffect(
    s.on(items, () => {
      if (!viewRef) return;
      setSlice(items().slice(start(), end()));
    }, { defer: true })
  );

  return (
    <view
      {...props}
      ref={lngp.chainRefs(el => { viewRef = el as lngp.NavigableElement; }, props.ref)}
      selected={props.selected || 0}
      cursor={cursor()}
      onLeft={/* @once */ lngp.chainFunctions(props.onLeft, onLeft)}
      onRight={/* @once */ lngp.chainFunctions(props.onRight, onRight)}
      onUp={/* @once */ lngp.chainFunctions(props.onUp, onUpDown)}
      onDown={/* @once */ lngp.chainFunctions(props.onDown, onUpDown)}
      forwardFocus={/* @once */ lngp.onGridFocus(chainedOnSelectedChanged)}
      onCreate={/* @once */ props.selected ? lngp.chainFunctions(props.onCreate, columnScroll) : props.onCreate}
      scrollToIndex={/* @once */ scrollToIndex}
      onSelectedChanged={/* @once */ chainedOnSelectedChanged}
      style={/* @once */ lng.combineStyles(props.style, rowStyles)}
    >
      <List each={slice()}>{props.children}</List>
    </view>
  );
}
