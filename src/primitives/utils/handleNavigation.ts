import * as lng from '@lightningtv/solid';
import * as lngp from '@lightningtv/solid/primitives';

export const navigableOnNavigation: lng.KeyHandler = function (e) {
  return moveSelection(
    this as lngp.NavigableElement,
    e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 1,
  );
};

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

  this.selected = this.selected || 0;
  let child = this.selected ? this.children[this.selected] : this.selectedNode;

  while (child?.skipFocus) {
    this.selected++;
    child = this.children[this.selected];
  }
  if (!(child instanceof lng.ElementNode)) return false;
  child.setFocus();

  const grid = this as lngp.NavigableElement;
  grid.onSelectedChanged?.(grid.selected, grid, child);

  return true;
};

export function moveSelection(
  el: lngp.NavigableElement,
  delta: number,
): boolean {
  const numChildren = el.children.length;
  const lastSelected = el.selected || 0;

  if (numChildren === 0) {
    return false;
  }

  if (delta > 0) {
    do {
      el.selected = ((el.selected || 0) % numChildren) + 1;
      if (el.selected >= numChildren) {
        if (!el.wrap) {
          el.selected = -1;
          break;
        }
        el.selected = 0;
      }
    } while (el.children[el.selected]?.skipFocus);
  } else if (delta < 0) {
    do {
      el.selected = ((el.selected || 0) % numChildren) - 1;
      if (el.selected < 0) {
        if (!el.wrap) {
          el.selected = -1;
          break;
        }
        el.selected = numChildren - 1;
      }
    } while (el.children[el.selected]?.skipFocus);
  }

  if (el.selected === -1) {
    el.selected = lastSelected;
    if (lng.isFocused(el)) {
      // This child is already focused, so bubble up to next handler
      return false;
    }
  }
  const active = el.children[el.selected || 0] || el.children[0];
  if (!(active instanceof lng.ElementNode)) return false;
  const navigableThis = el as lngp.NavigableElement;

  navigableThis.onSelectedChanged?.(
    navigableThis.selected,
    navigableThis,
    active,
    lastSelected,
  );

  if (el.plinko) {
    // Set the next item to have the same selected index
    // so we move up / down directly
    const lastSelectedChild = el.children[lastSelected];
    lng.assertTruthy(lastSelectedChild instanceof lng.ElementNode);
    const num = lastSelectedChild.selected || 0;
    active.selected =
      num < active.children.length ? num : active.children.length - 1;
  }
  active.setFocus();
  return true;
}

/** @deprecated Use {@link navigableForwardFocus} instead */
export function onGridFocus(
  onSelectedChanged: lngp.OnSelectedChanged | undefined,
): lng.ForwardFocusHandler {
  return function () {
    this.onSelectedChanged = onSelectedChanged;
    navigableForwardFocus.call(this, this);
  };
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
