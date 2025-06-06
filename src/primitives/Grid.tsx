import { For, createSignal, createMemo, createEffect, JSX } from "solid-js";
import { type NodeProps, ElementNode, NewOmit } from "@lightningtv/solid";
import { chainRefs } from "./utils/chainFunctions.js";

export interface GridItemProps<T> {
  item:   T
  index:  number
  width:  number
  height: number
  x:      number
  y:      number
}

export interface GridProps<T> extends NewOmit<NodeProps, 'children'> {
  items: T[];
  children: (props: GridItemProps<T>) => JSX.Element,
  itemHeight?: number;
  itemWidth?: number;
  itemOffset?: number;
  columns?: number;
  looping?: boolean;
  scroll?: "auto" | "none";
  onSelectedChanged?: (index: number, grid: ElementNode, elm?: ElementNode) => void;
}

export function Grid<T>(props: GridProps<T>): JSX.Element {

  const [focusedIndex, setFocusedIndex] = createSignal(0);
  const baseColumns = 4;

  const itemWidth = () => props.itemWidth ?? 300
  const itemHeight = () => props.itemHeight ?? 300

  const columns = createMemo(() => props.columns || baseColumns);
  const totalWidth = createMemo(() => itemWidth() + (props.itemOffset ?? 0));
  const totalHeight = createMemo(() => itemHeight() + (props.itemOffset ?? 0));

  function focus() {
    const focusedElm = gridRef.children[focusedIndex()];
    if (focusedElm instanceof ElementNode && !focusedElm.states.has('$focus')) {
      focusedElm.setFocus();
      props.onSelectedChanged?.call(gridRef, focusedIndex(), gridRef, focusedElm);
      return true;
    }
    return false;
  }

  function moveFocus(delta: number) {
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
    return focus();
  };

  function handleHorizontalFocus(delta: number) {
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
    return focus();
  };

  // Handle focus when items change - important for autofocus
  createEffect(() => {
    if (props.items && props.items.length > 0 && gridRef && gridRef.states.has('$focus')) {
      queueMicrotask(focus)
    }
  })

  const scrollY = createMemo(() =>
    props.scroll === "none" ? props.y ?? 0 : -Math.floor(focusedIndex() / columns()) * totalHeight() + (props.y || 0)
  );

  let gridRef!: ElementNode;
  return (
    <view
      {...props}
      ref={chainRefs(el => gridRef = el, props.ref)}
      transition={{ y: true }}
      onUp={() => moveFocus(-columns())}
      onDown={() => moveFocus(columns())}
      onLeft={() => handleHorizontalFocus(-1)}
      onRight={() => handleHorizontalFocus(1)}
      onFocus={() => handleHorizontalFocus(0)}
      strictBounds={false}
      y={scrollY()}
    >
      <For each={props.items}>
        {(item, index) => (
          <props.children
            item={item}
            index={index()}
            width={itemWidth()}
            height={itemHeight()}
            x={(index() % columns()) * totalWidth()}
            y={Math.floor(index() / columns()) * totalHeight()}
          />
        )}
      </For>
    </view>
  );
};
