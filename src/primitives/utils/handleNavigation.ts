import * as s from 'solid-js';
import * as lng from '@lightningtv/solid';
import * as lngp from '@lightningtv/solid/primitives';

function isSelectableChild(el: lng.ElementNode | lng.ElementText): boolean {
  return !el.skipFocus && !lng.isFocused(el);
}

function findFirstSelectableChildIdx(
  el: lngp.NavigableElement,
  from = 0,
  delta = 1,
): number {
  for (let i = from; ; i += delta) {
    if (i < 0 || i >= el.children.length) {
      if (el.wrap) {
        i = (i + el.children.length) % el.children.length;
      } else break;
    }
    if (isSelectableChild(el.children[i]!)) {
      return i;
    }
  }
  return -1;
}

function selectChild(el: lngp.NavigableElement, index: number): boolean {
  if (index < 0 || index >= el.children.length) return false;
  const child = el.children[index]!;
  if (!isSelectableChild(child)) return false;
  child.setFocus();
  el.selected = index;
  el.onSelectedChanged?.(index, el, child as lng.ElementNode);
  return true;
}

/** @deprecated Use {@link navigableOnNavigation} instead */
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

export const navigableOnNavigation: lng.KeyHandler = function (e) {
  return moveSelection(
    this as lngp.NavigableElement,
    e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 1,
  );
};

/** @deprecated Use {@link navigableForwardFocus} instead */
export function onGridFocus(
  _?: lngp.OnSelectedChanged,
): lng.ForwardFocusHandler {
  return function () {
    return navigableForwardFocus.call(this, this);
  };
}

export const navigableForwardFocus: lng.ForwardFocusHandler = function () {
  if (!this || this.children.length === 0) return false;

  // only check onFocus, and not when grid.setFocus() to retrigger focus
  if (!this.states.has(lng.Config.focusStateKey)) {
    // if a child already has focus, assume that should be selected
    this.children.find((child, index) => {
      if (child.states.has(lng.Config.focusStateKey)) {
        this.selected = index;
        return true;
      }
      return false;
    });
  }

  const lastSelected = this.selected;
  this.selected = this.selected || 0;
  let child = this.selected ? this.children[this.selected] : this.selectedNode;

  while (child?.skipFocus) {
    this.selected++;
    child = this.children[this.selected];
  }
  if (!(child instanceof lng.ElementNode)) return false;
  child.setFocus();

  const grid = this as lngp.NavigableElement;
  grid.onSelectedChanged?.(grid.selected, grid, child, lastSelected);

  return true;
};

export function moveSelection(
  el: lngp.NavigableElement,
  delta: number,
): boolean {
  let selected = findFirstSelectableChildIdx(el, el.selected + delta, delta);

  if (selected === -1) {
    if (el.selected < 0 || el.selected >= el.children.length) return false;
    if (!isSelectableChild(el.children[el.selected]!)) return false;
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

function getWeightedDistanceBetweenRects(a: lng.Rect, b: lng.Rect): number {
  const dx = Math.max(
    // dist from centers / 2
    Math.abs(a.x + a.width / 2 - (b.x + b.width / 2)) / 2,
    // dist from edges
    a.x - (b.x + b.width),
    b.x - (a.x + a.width),
  );
  const dy = Math.max(
    // dist from centers / 2
    Math.abs(a.y + a.height / 2 - (b.y + b.height / 2)) / 2,
    // dist from edges
    a.y - (b.y + b.height),
    b.y - (a.y + a.height),
  );
  return Math.sqrt(dx * dx + dy * dy);
}

function findClosestSelectableChildIdx(
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
    if (isSelectableChild(child)) {
      childRect.x = child.x + elRect.x;
      childRect.y = child.y + elRect.y;
      childRect.width = child.width;
      childRect.height = child.height;
      const distance = getWeightedDistanceBetweenRects(prevRect, childRect);
      if (distance < closestDist) {
        closestDist = distance;
        closestIdx = idx;
      }
    }
  }

  return closestIdx;
}

export const spatialForwardFocus: lng.ForwardFocusHandler = function () {
  const prevEl = s.untrack(lng.activeElement);
  if (prevEl) {
    const idx = findClosestSelectableChildIdx(this, prevEl);
    const selected = selectChild(this as lngp.NavigableElement, idx);
    if (selected) return true;
  }
  const idx = findFirstSelectableChildIdx(this as lngp.NavigableElement);
  return selectChild(this as lngp.NavigableElement, idx);
};

export const spatialOnNavigation: lng.KeyHandler = function (e) {
  let selected = this.selected;
  this.selected = -1; // fallback

  if (
    typeof selected !== 'number' ||
    selected < 0 ||
    selected >= this.children.length
  ) {
    selected = findFirstSelectableChildIdx(this as lngp.NavigableElement);
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
  const moveFlex = move[flexDir];
  const moveCross = move[crossDir];

  // Select next/prev child in the current column/row
  if (moveFlex !== 0) {
    for (
      let i = selected + moveFlex;
      i >= 0 && i < this.children.length;
      i += moveFlex
    ) {
      const child = this.children[i]!;
      if (!isSelectableChild(child)) continue;

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
      let i = selected + moveCross;
      i >= 0 && i < this.children.length;
      i += moveCross
    ) {
      const child = this.children[i]!;
      if (!isSelectableChild(child)) continue;

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
