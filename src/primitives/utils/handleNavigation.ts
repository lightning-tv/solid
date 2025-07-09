import { ElementNode, assertTruthy, Config } from '@lightningtv/core';
import { type KeyHandler } from '@lightningtv/core/focusManager';
import type { NavigableElement, OnSelectedChanged } from '../types.js';

export function onGridFocus(onSelectedChanged: OnSelectedChanged | undefined) {
  return function (this: ElementNode) {
    if (!this || this.children.length === 0) return false;

    // only check onFocus, and not when grid.setFocus() to retrigger focus
    if (!this.states.has(Config.focusStateKey)) {
      // if a child already has focus, assume that should be selected
      this.children.find((child, index) => {
        if (child.states.has(Config.focusStateKey)) {
          this.selected = index;
          return true;
        }
        return false;
      });
    }

    this.selected = this.selected || 0;
    let child = this.selected
      ? this.children[this.selected]
      : this.selectedNode;

    while (child?.skipFocus) {
      this.selected++;
      child = this.children[this.selected];
    }
    if (!(child instanceof ElementNode)) return false;
    child.setFocus();

    if (onSelectedChanged) {
      const grid = this as NavigableElement;
      onSelectedChanged.call(grid, grid.selected, grid, child);
    }
    return true;
  };
}

export function handleNavigation(
  direction: 'up' | 'right' | 'down' | 'left',
): KeyHandler {
  return function () {
    const numChildren = this.children.length;
    const wrap = this.wrap;
    const lastSelected = this.selected || 0;

    if (numChildren === 0) {
      return false;
    }

    if (direction === 'right' || direction === 'down') {
      do {
        this.selected = ((this.selected || 0) % numChildren) + 1;
        if (this.selected >= numChildren) {
          if (!wrap) {
            this.selected = -1;
            break;
          }
          this.selected = 0;
        }
      } while (this.children[this.selected]?.skipFocus);
    } else if (direction === 'left' || direction === 'up') {
      do {
        this.selected = ((this.selected || 0) % numChildren) - 1;
        if (this.selected < 0) {
          if (!wrap) {
            this.selected = -1;
            break;
          }
          this.selected = numChildren - 1;
        }
      } while (this.children[this.selected]?.skipFocus);
    }

    if (this.selected === -1) {
      this.selected = lastSelected;
      if (
        this.children[this.selected]?.states!.has(
          Config.focusStateKey || '$focus',
        )
      ) {
        // This child is already focused, so bubble up to next handler
        return false;
      }
    }
    const active = this.children[this.selected || 0] || this.children[0];
    if (!(active instanceof ElementNode)) return false;
    const navigableThis = this as NavigableElement;

    navigableThis.onSelectedChanged &&
      navigableThis.onSelectedChanged.call(
        navigableThis,
        navigableThis.selected,
        navigableThis,
        active,
        lastSelected,
      );

    if (this.plinko) {
      // Set the next item to have the same selected index
      // so we move up / down directly
      const lastSelectedChild = this.children[lastSelected];
      assertTruthy(lastSelectedChild instanceof ElementNode);
      const num = lastSelectedChild.selected || 0;
      active.selected =
        num < active.children.length ? num : active.children.length - 1;
    }
    active.setFocus();
    return true;
  };
}
