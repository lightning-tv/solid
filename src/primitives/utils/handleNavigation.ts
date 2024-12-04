import { ElementNode, assertTruthy, Config } from '@lightningtv/core';
import { type KeyHandler } from '@lightningtv/core/focusManager';
import type { NavigableElement, OnSelectedChanged } from '../types.js';

export function onGridFocus(this: ElementNode) {
  if (!this || this.children.length === 0) return false;

  this.selected = this.selected || 0;
  let child = this.selected ? this.children[this.selected] : this.selectedNode;

  while (child?.skipFocus) {
    this.selected++;
    child = this.children[this.selected];
  }
  if (!(child instanceof ElementNode)) return false;
  child.setFocus();
  return true;
}

// Converts params from onFocus to onSelectedChanged
export function handleOnSelect(onSelectedChanged: OnSelectedChanged) {
  return function (this: NavigableElement) {
    return onSelectedChanged.call(
      this,
      this.selected,
      this,
      this.children[this.selected] as ElementNode,
    );
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
    const active = this.children[this.selected || 0];
    assertTruthy(active instanceof ElementNode);
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
