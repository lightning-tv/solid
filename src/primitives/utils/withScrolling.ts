import type {
  ElementNode,
  ElementText,
  INode,
  Styles,
} from '@lightningtv/core';

// Adds properties expected by withScrolling
export interface ScrollableElement extends ElementNode {
  scrollIndex?: number;
  selected: number;
  offset?: number;
  endOffset?: number;
  onScrolled?: () => void;
  onUnscrolled?: () => void;
  _targetPosition?: number;
  _screenOffset?: number;
  _initialPosition?: number;
}

// From the renderer, not exported
const InViewPort = 8;
const isNotShown = (node: ElementNode | ElementText) => {
  return node.lng.renderState !== InViewPort;
};
/*
  Auto Scrolling starts scrolling right away until the last item is shown. Keeping a full view of the list.
  Edge starts scrolling when it reaches the edge of the viewport.
  Always scroll moves the list every time
*/

export function withScrolling(isRow: boolean) {
  const dimension = isRow ? 'width' : 'height';
  const axis = isRow ? 'x' : 'y';

  return (
    selected: number | ElementNode,
    component?: ElementNode,
    selectedElement?: ElementNode | ElementText,
    lastSelected?: number,
  ) => {
    let componentRef = component as ScrollableElement;
    if (typeof selected !== 'number') {
      componentRef = selected as ScrollableElement;
      selected = componentRef.selected || 0;
    }
    if (
      !componentRef ||
      componentRef.scroll === 'none' ||
      !componentRef.children.length
    )
      return;

    if (componentRef._initialPosition === undefined) {
      componentRef._initialPosition = componentRef[axis];
    }

    const lng = componentRef.lng as INode;
    const screenSize = isRow ? lng.stage.root.width : lng.stage.root.height;
    // Determine if movement is incremental or decremental
    const isIncrementing =
      lastSelected === undefined || lastSelected - 1 !== selected;

    if (componentRef._screenOffset === undefined) {
      if (componentRef.parent!.clipping) {
        const p = componentRef.parent!;
        componentRef.endOffset =
          screenSize - ((isRow ? p.absX : p.absY) || 0) - p[dimension];
      }

      componentRef._screenOffset =
        componentRef.offset ??
        (isRow ? lng.absX : lng.absY) - componentRef[axis];
    }

    const screenOffset = componentRef._screenOffset;
    const gap = componentRef.gap || 0;
    const scroll = componentRef.scroll || 'auto';

    // Allows manual position control
    const targetPosition = componentRef._targetPosition ?? componentRef[axis];
    const rootPosition = isIncrementing
      ? Math.min(targetPosition, componentRef[axis])
      : Math.max(targetPosition, componentRef[axis]);
    componentRef.offset = componentRef.offset ?? rootPosition;
    const offset = componentRef.offset;
    selectedElement =
      selectedElement ||
      (componentRef.children[selected] as ElementNode | undefined);

    if (!selectedElement) {
      return;
    }
    const selectedPosition = selectedElement[axis] ?? 0;
    const selectedSize = selectedElement[dimension] ?? 0;
    const selectedScale =
      selectedElement.scale ??
      (selectedElement.style?.focus as Styles)?.scale ??
      1;
    const selectedSizeScaled = selectedSize * selectedScale;
    const containerSize = componentRef[dimension] ?? 0;
    const maxOffset = Math.min(
      screenSize -
        containerSize -
        screenOffset -
        (componentRef.endOffset || 2 * gap),
      offset,
    );

    // Determine the next element based on whether incrementing or decrementing
    const nextIndex = isIncrementing ? selected + 1 : selected - 1;
    const nextElement = componentRef.children[nextIndex] || null;

    // Default nextPosition to align with the selected position and offset
    let nextPosition = rootPosition;

    // Update nextPosition based on scroll type and specific conditions
    if (selectedElement.centerScroll) {
      nextPosition = -selectedPosition + (screenSize - selectedSizeScaled) / 2;
    } else if (scroll === 'always') {
      nextPosition = -selectedPosition + offset;
    } else if (scroll === 'center') {
      const centerPosition =
        -selectedPosition +
        (screenSize - selectedSizeScaled) / 2 -
        screenOffset;
      // clamp position to avoid going beyond bounds
      nextPosition = Math.min(Math.max(centerPosition, maxOffset), offset);
    } else if (!nextElement) {
      // If at the last element, align to end
      nextPosition = isIncrementing ? maxOffset : offset;
    } else if (scroll === 'auto') {
      if (componentRef.scrollIndex && componentRef.scrollIndex > 0) {
        // Prevent scrolling if the selected item is within the last scrollIndex items
        const totalItems = componentRef.children.length;
        const nearEndIndex = totalItems - componentRef.scrollIndex;

        if (
          isIncrementing &&
          componentRef.selected >= componentRef.scrollIndex
        ) {
          nextPosition = rootPosition - selectedSize - gap;
        } else if (!isIncrementing && componentRef.selected < nearEndIndex) {
          nextPosition = rootPosition + selectedSize + gap;
        }
      } else if (isIncrementing) {
        nextPosition = -selectedPosition + offset;
      } else {
        nextPosition = rootPosition + selectedSize + gap;
      }
    } // Handle Edge scrolling
    else if (isIncrementing && isNotShown(nextElement)) {
      nextPosition = rootPosition - selectedSize - gap;
    } else if (isNotShown(nextElement)) {
      nextPosition = -selectedPosition + offset;
    }

    // Prevent container from moving beyond bounds
    nextPosition =
      isIncrementing && scroll !== 'always'
        ? Math.max(nextPosition, maxOffset)
        : Math.min(nextPosition, offset);

    // Update position if it has changed
    if (componentRef[axis] !== nextPosition) {
      if (
        componentRef.onScrolled &&
        componentRef[axis] === componentRef._initialPosition
      ) {
        componentRef.onScrolled();
      }

      if (
        componentRef.onUnscrolled &&
        componentRef._targetPosition !== componentRef._initialPosition &&
        componentRef._initialPosition === nextPosition
      ) {
        componentRef.onUnscrolled();
      }

      componentRef[axis] = nextPosition;
      // Store the new position to keep track during animations
      componentRef._targetPosition = nextPosition;
    }
  };
}
