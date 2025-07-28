import * as s from 'solid-js';
import * as lng from '@lightningtv/solid';
import * as lngp from '@lightningtv/solid/primitives';

declare module '@lightningtv/core' {
  interface ElementNode {
    /** For children of {@link lngp.NavigableElement}, set to `true` to prevent being selected */
    skipFocus?: boolean;
  }
}

function idxInArray(idx: number, arr: readonly any[]): boolean {
  return idx >= 0 && idx < arr.length;
}

function findFirstFocusableChildIdx(
  el: lngp.NavigableElement,
  from = 0,
  delta = 1,
): number {
  for (let i = from; ; i += delta) {
    if (!idxInArray(i, el.children)) {
      if (el.wrap) {
        i = (i + el.children.length) % el.children.length;
      } else break;
    }
    if (!el.children[i]!.skipFocus) {
      return i;
    }
  }
  return -1;
}

function selectChild(el: lngp.NavigableElement, index: number): boolean {
  const child = el.children[index];

  if (child == null || child.skipFocus) {
    el.selected = -1;
    return false;
  }

  const lastSelected = el.selected;
  el.selected = index;
  child.setFocus();

  if (lastSelected !== index || !lng.hasFocus(el)) {
    el.onSelectedChanged?.(index, el, child as lng.ElementNode, lastSelected);
  }

  return true;
}

/** @deprecated Use {@link navigableForwardFocus} instead */
export function onGridFocus(
  _?: lngp.OnSelectedChanged,
): lng.ForwardFocusHandler {
  return function () {
    return navigableForwardFocus.call(this, this);
  };
}

/**
 * Forwards focus to the first focusable child of a {@link lngp.NavigableElement} and
 * selects it.
 *
 * @example
 * ```tsx
 * <view
 *   selected={0}
 *   forwardFocus={navigableForwardFocus}
 *   onSelectedChanged={(idx, el, child, lastIdx) => {...}}
 * >
 * ```
 */
export const navigableForwardFocus: lng.ForwardFocusHandler = function () {
  const navigable = this as lngp.NavigableElement;

  // Undo for now - We should only do this when setFocus is called rather than on forwardFocus
  // needs some more research
  // if (!lng.isFocused(this)) {
  //   // if a child already has focus, assume that should be selected
  //   for (let [i, child] of this.children.entries()) {
  //     if (lng.isFocused(child)) {
  //       this.selected = i;
  //       break;
  //     }
  //   }
  // }

  let selected = navigable.selected;
  selected = idxInArray(selected, this.children) ? selected : 0;
  selected = findFirstFocusableChildIdx(navigable, selected);
  return selectChild(navigable, selected);
};

/** @deprecated Use {@link navigableHandleNavigation} instead */
export function handleNavigation(
  direction: 'up' | 'right' | 'down' | 'left',
): lng.KeyHandler {
  return function () {
    return moveSelection(
      this as lngp.NavigableElement,
      direction === 'up' || direction === 'left' ? -1 : 1,
    );
  };
}

/**
 * Handles navigation key events for navigable elements, \
 * such as {@link lngp.Row} and {@link lngp.Column}.
 *
 * Uses {@link moveSelection} to select the next or previous child based on the key pressed.
 *
 * @example
 * ```tsx
 * <view
 *   selected={0}
 *   onUp={navigableHandleNavigation}
 *   onDown={navigableHandleNavigation}
 *   onSelectedChanged={(idx, el, child, lastIdx) => {...}}
 * >
 * ```
 */
export const navigableHandleNavigation: lng.KeyHandler = function (e) {
  return moveSelection(
    this as lngp.NavigableElement,
    e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 1,
  );
};

/**
 * Moves the selection within a {@link lngp.NavigableElement}.
 */
export function moveSelection(
  el: lngp.NavigableElement,
  delta: number,
): boolean {
  let selected = findFirstFocusableChildIdx(el, el.selected + delta, delta);

  if (selected === -1) {
    if (
      !idxInArray(el.selected, el.children) ||
      el.children[el.selected]!.skipFocus ||
      lng.isFocused(el.children[el.selected]!)
    ) {
      return false;
    }
    selected = el.selected;
  }

  const active = el.children[selected]!;

  if (el.plinko) {
    // Set the next item to have the same selected index
    // so we move up / down directly
    const lastSelectedChild = el.children[el.selected];
    lng.assertTruthy(lastSelectedChild instanceof lng.ElementNode);

    const num = lastSelectedChild.selected || 0;
    active.selected =
      num < active.children.length ? num : active.children.length - 1;
  }

  return selectChild(el, selected);
}

function distanceBetweenRectCenters(a: lng.Rect, b: lng.Rect): number {
  const dx = Math.abs(a.x + a.width / 2 - (b.x + b.width / 2)) / 2;
  const dy = Math.abs(a.y + a.height / 2 - (b.y + b.height / 2)) / 2;
  return Math.sqrt(dx * dx + dy * dy);
}

function findClosestFocusableChildIdx(
  el: lng.ElementNode,
  prevEl: lng.ElementNode,
): number {
  // select child closest to the previous active element
  const prevRect = lng.getElementScreenRect(prevEl);
  const elRect = lng.getElementScreenRect(el);
  const childRect: lng.Rect = { x: 0, y: 0, width: 0, height: 0 };

  let closestIdx = -1;
  let closestDist = Infinity;

  for (const [idx, child] of el.children.entries()) {
    if (!child.skipFocus) {
      lng.getElementScreenRect(child, el, childRect);
      childRect.x += elRect.x;
      childRect.y += elRect.y;
      const distance = distanceBetweenRectCenters(prevRect, childRect);
      if (distance < closestDist) {
        closestDist = distance;
        closestIdx = idx;
      }
    }
  }

  return closestIdx;
}

/**
 * Forwards focus to the closest or first focusable child of a {@link lngp.NavigableElement} and
 * selects it.
 *
 * To determine the closest child, it uses the distance between the center of the previous focused element
 * and the center of each child element.
 *
 * @example
 * ```tsx
 * <view
 *   selected={0}
 *   forwardFocus={spatialForwardFocus}
 *   onSelectedChanged={(idx, el, child, lastIdx) => {...}}
 * >
 * ```
 */
export const spatialForwardFocus: lng.ForwardFocusHandler = function () {
  const prevEl = s.untrack(lng.activeElement);
  if (prevEl) {
    const idx = findClosestFocusableChildIdx(this, prevEl);
    const selected = selectChild(this as lngp.NavigableElement, idx);
    if (selected) return true;
  }
  const idx = findFirstFocusableChildIdx(this as lngp.NavigableElement);
  return selectChild(this as lngp.NavigableElement, idx);
};

/**
 * Handles spatial navigation within a {@link lngp.NavigableElement} by moving focus
 * based on the arrow keys pressed.
 *
 * This function allows for navigation in a grid-like manner for flex-wrap containers, \
 * where pressing the arrow keys will either:
 * - move focus to the next/prev child in the same row/column
 * - or find the closest child in the next/prev row/column.
 *
 * @example
 * ```tsx
 * <view
 *   selected={0}
 *   display="flex"
 *   flexWrap="wrap"
 *   onUp={spatialHandleNavigation}
 *   onDown={spatialHandleNavigation}
 *   onSelectedChanged={(idx, el, child, lastIdx) => {...}}
 * >
 * ```
 */
export const spatialHandleNavigation: lng.KeyHandler = function (e) {
  let selected = this.selected;

  if (typeof selected !== 'number' || !idxInArray(selected, this.children)) {
    selected = findFirstFocusableChildIdx(this as lngp.NavigableElement);
    return selectChild(this as lngp.NavigableElement, selected);
  }

  const prevChild = this.children[selected]!;

  const move = { x: 0, y: 0 };
  switch (e.key) {
    case 'ArrowLeft':
      move.x = -1;
      break;
    case 'ArrowRight':
      move.x = 1;
      break;
    case 'ArrowUp':
      move.y = -1;
      break;
    case 'ArrowDown':
      move.y = 1;
      break;
    default:
      return false;
  }

  const flexDir = this.flexDirection === 'column' ? 'y' : 'x';
  const crossDir = flexDir === 'x' ? 'y' : 'x';
  const flexDelta = move[flexDir];
  const crossDelta = move[crossDir];

  // Select next/prev child in the current column/row
  if (flexDelta !== 0) {
    for (
      let i = selected + flexDelta;
      idxInArray(i, this.children);
      i += flexDelta
    ) {
      const child = this.children[i]!;
      if (child.skipFocus) continue;

      // Different column/row
      if (child[crossDir] !== prevChild[crossDir]) break;

      return selectChild(this as lngp.NavigableElement, i);
    }
  }
  // Find child in next/prev column/row
  else {
    let closestIdx = -1;
    let closestDist = Infinity;

    for (
      let i = selected + crossDelta;
      idxInArray(i, this.children);
      i += crossDelta
    ) {
      const child = this.children[i]!;
      if (child.skipFocus) continue;

      // Same column/row, skip
      if (child[crossDir] === prevChild[crossDir]) continue;

      // Different column/row, check distance
      const distance = Math.abs(child[flexDir] - prevChild[flexDir]);
      if (distance >= closestDist) break; // getting further away

      closestDist = distance;
      closestIdx = i;
    }

    return selectChild(this as lngp.NavigableElement, closestIdx);
  }

  return false;
};
