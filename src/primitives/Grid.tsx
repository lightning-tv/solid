import { ValidComponent, For, createSignal, createMemo } from "solid-js";
import { Dynamic, type NodeProps, type ElementNode, isFunction } from "@lightningtv/solid";

export const Grid = <T,>(props: {
  item: ValidComponent;
  itemHeight?: number;
  itemWidth?: number;
  itemOffset?: number;
  items: T[];
  columns?: number;
  looping?: boolean;
  scroll?: "auto" | "none";
  onSelectedChanged?: (index: number, grid: ElementNode, elm?: ElementNode) => void;
} & NodeProps) => {
  const [focusedIndex, setFocusedIndex] = createSignal(0);
  const baseColumns = 4;

  const columns = createMemo(() => props.columns || baseColumns);
  const totalWidth = createMemo(() => (props.itemWidth ?? 300) + (props.itemOffset ?? 0));
  const totalHeight = createMemo(() => (props.itemHeight ?? 300) + (props.itemOffset ?? 0));

  const moveFocus = (delta: number, elm: ElementNode) => {
    if (!props.items || props.items.length === 0) return false;
    const newIndex = focusedIndex() + delta;

    if (newIndex >= 0 && newIndex < props.items.length) {
      setFocusedIndex(newIndex);
    } else if (props.looping) {
      const totalItems = props.items.length;
      if (delta < 0) {
        const lastRowStart = totalItems - (totalItems % columns()) || totalItems - columns();
        const target = lastRowStart + (focusedIndex() % columns());
        setFocusedIndex(target < totalItems ? target : target - columns());
      } else {
        setFocusedIndex(focusedIndex() % columns());
      }
    } else {
      return false;
    }
    const focusedElm = elm.children[focusedIndex()] as ElementNode;
    focusedElm.setFocus();
    isFunction(props.onSelectedChanged) && props.onSelectedChanged.call(elm, focusedIndex(), elm, focusedElm);
    return true;
  };

  const handleHorizontalFocus = (delta: number, elm: ElementNode) => {
    if (!props.items || props.items.length === 0) return false;
    const newIndex = focusedIndex() + delta;
    const isWithinRow = Math.floor(newIndex / columns()) === Math.floor(focusedIndex() / columns());

    if (newIndex >= 0 && newIndex < props.items.length && isWithinRow) {
      setFocusedIndex(newIndex);
    } else if (props.looping) {
      const rowStart = Math.floor(focusedIndex() / columns()) * columns();
      const rowEnd = Math.min(rowStart + columns() - 1, props.items.length - 1);
      setFocusedIndex(delta > 0 ? (newIndex > rowEnd ? rowStart : newIndex) : newIndex < rowStart ? rowEnd : newIndex);
    } else {
      return false;
    }
    const focusedElm = elm.children[focusedIndex()] as ElementNode;
    focusedElm.setFocus();
    isFunction(props.onSelectedChanged) && props.onSelectedChanged.call(elm, focusedIndex(), elm, focusedElm);
    return true;
  };

  function onFocus(this: ElementNode) {
    handleHorizontalFocus(0, this);
  }

  const scrollY = createMemo(() =>
    props.scroll === "none" ? props.y ?? 0 : -Math.floor(focusedIndex() / columns()) * totalHeight() + (props.y || 0)
  );

  return (
    <view
      transition={{ y: true }}
      {...props}
      onUp={(_e, elm) => moveFocus(-columns(), elm)}
      onDown={(_e, elm) => moveFocus(columns(), elm)}
      onLeft={(_e, elm) => handleHorizontalFocus(-1, elm)}
      onRight={(_e, elm) => handleHorizontalFocus(1, elm)}
      onFocus={onFocus}
      strictBounds={false}
      y={scrollY()}
    >
      <For each={props.items}>
        {(item, index) => (
          <Dynamic
            {...item}
            component={props.item}
            width={props.itemWidth}
            height={props.itemHeight}
            x={(index() % columns()) * totalWidth()}
            y={Math.floor(index() / columns()) * totalHeight()}
          />
        )}
      </For>
    </view>
  );
};

