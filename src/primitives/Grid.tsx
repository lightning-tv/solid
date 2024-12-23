import { Component, ValidComponent, For, createSignal, createMemo } from "solid-js";
import { View, Dynamic } from "@lightningtv/solid";
import { createEffect } from "solid-js";

export const Grid: Component<{
  item: ValidComponent;
  itemHeight: number;
  itemWidth: number;
  itemOffset?: number;
  items: Array<{ id: string }>;
  columns?: number;
  looping?: boolean;
  refocusParent?: () => void;
}> = props => {
  const [focusedIndex, setFocusedIndex] = createSignal(0, { equals: false });
  const baseColumns = 4;

  const columns = createMemo(() => props.columns || baseColumns);
  const totalWidth = createMemo(() => (props.itemWidth || 300) + (props.itemOffset || 0));
  const totalHeight = createMemo(() => (props.itemHeight || 300) + (props.itemOffset || 0));

  const moveFocus = (delta: number) => {
    const newIndex = focusedIndex() + delta;

    if (newIndex >= 0 && newIndex < props.items.length) {
      setFocusedIndex(newIndex);
    } else if (props.looping) {
      const totalItems = props.items.length;
      if (delta < 0) {
        // Handle wrap to the last row
        const lastRowStart = totalItems - (totalItems % columns());
        const target = lastRowStart + (focusedIndex() % columns());
        setFocusedIndex(target < totalItems ? target : target - columns());
      } else {
        // Handle wrap to the first row
        setFocusedIndex(focusedIndex() % columns());
      }
    } else if (props.refocusParent) {
      props.refocusParent();
    }
  };

  const handleHorizontalFocus = (delta: number) => {
    if (!props.items) {
      return;
    }
    const newIndex = focusedIndex() + delta;
    const isWithinRow = Math.floor(newIndex / columns()) === Math.floor(focusedIndex() / columns());
    if (newIndex >= 0 && newIndex < props.items.length && isWithinRow) {
      setFocusedIndex(newIndex);
    } else if (props.looping) {
      const rowStart = Math.floor(focusedIndex() / columns()) * columns();
      const rowEnd = rowStart + columns() - 1;
      setFocusedIndex(
        delta > 0 ? (newIndex > rowEnd ? rowStart : newIndex) : newIndex < rowStart ? rowEnd : newIndex,
      );
    } else if (props.refocusParent) {
      props.refocusParent();
    }
  };

  let gridRef;
  createEffect(() => {
    const index = focusedIndex();
    gridRef!.children[index]?.setFocus();
  });

  return (
    <View
      {...props}
      ref={gridRef}
      onUp={() => moveFocus(-columns())}
      onDown={() => moveFocus(columns())}
      onLeft={() => handleHorizontalFocus(-1)}
      onRight={() => handleHorizontalFocus(1)}
      onFocus={() => handleHorizontalFocus(0)}
      strictBounds={false}
      x={20}
      y={-Math.floor(focusedIndex() / columns()) * totalHeight() + 20}
      transition={{ y: true }}
    >
      <For each={props.items}>
        {(item, index) => (
          <Dynamic
            component={props.item}
            item={item}
            x={(index() % columns()) * totalWidth()}
            y={Math.floor(index() / columns()) * totalHeight()}
            width={props.itemWidth}
            height={props.itemHeight}
          />
        )}
      </For>
    </View>
  );
};

export default Grid;
