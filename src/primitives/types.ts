import type { ElementNode, NodeProps, NodeStyles } from '@lightningtv/solid';
import type { KeyHandler } from '@lightningtv/core/focusManager';

export type OnSelectedChanged = (
  this: NavigableElement,
  selectedIndex: number,
  elm: NavigableElement,
  active: ElementNode,
  lastSelectedIndex?: number,
) => void;

export interface NavigableProps extends NodeProps {
  /** function to be called when the selected of the component changes */
  onSelectedChanged?: OnSelectedChanged;

  /** Determines when to scroll(shift items along the axis):
   * auto - scroll items immediately
   * edge - scroll items when focus reaches the last item on screen
   * always - focus remains at index 0, scroll until the final item is at index 0
   * center - selected element will be centered to the screen
   * none - disable scrolling behavior, focus shifts as expected
   * in both `auto` and `edge` items will only scroll until the last item is on screen */
  scroll?: 'always' | 'none' | 'edge' | 'auto' | 'center';

  /** When auto scrolling, item index at which scrolling begins */
  scrollIndex?: number;

  /** The initial index */
  selected?: number;

  /**
   * Adjust the x position of the row. Initial value is Y
   */
  offset?: number;

  /**
   * Plinko - sets the selected item of the next row to match the previous row
   */
  plinko?: boolean;

  /**
   * Wrap the row so active goes back to the beginning of the row
   */
  wrap?: boolean;

  /** function to be called when scrolled */
  onScrolled?: () => void;

  /** function to be called when unscrolled, back to its initial position */
  onUnscrolled?: () => void;
}

// @ts-expect-error animationSettings is not identical - weird
export interface NavigableElement extends ElementNode, NavigableProps {
  selected: number;
}

export interface NavigableStyleProperties {
  /**
   * the index of which we want scrolling to start
   */
  scrollIndex?: number;
  /**
   * space between each keys
   */
  itemSpacing?: NodeStyles['gap'];
  /**
   * animation transition
   */
  itemTransition?: NodeStyles['transition'];
}

export interface ColumnProps extends NavigableProps, NavigableStyleProperties {
  /** function to be called on down click */
  onDown?: KeyHandler;

  /** function to be called on up click */
  onUp?: KeyHandler;
}

export interface RowProps extends NavigableProps, NavigableStyleProperties {
  /** function to be called on down click */
  onLeft?: KeyHandler;

  /** function to be called on up click */
  onRight?: KeyHandler;
}
