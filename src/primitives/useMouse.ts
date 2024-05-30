import type { INode } from '@lightningjs/renderer';
import {
  ElementNode,
  activeElement,
  setActiveElement,
  rootNode,
} from '@lightningtv/solid';
import { makeEventListener } from '@solid-primitives/event-listener';
import { useMousePosition } from '@solid-primitives/mouse';
import { createScheduled, throttle } from '@solid-primitives/scheduled';
import { createEffect } from 'solid-js';

interface MainOnlyNode extends INode {
  coreNode: {
    absX: number;
    absY: number;
  };
}

function createKeyboardEvent(key: string, keyCode: number): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    keyCode,
    which: keyCode,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
  });
}

const handleScroll = throttle((e: WheelEvent): void => {
  const deltaY = e.deltaY;
  if (deltaY < 0) {
    document.dispatchEvent(createKeyboardEvent('ArrowUp', 38));
  } else if (deltaY > 0) {
    document.dispatchEvent(createKeyboardEvent('ArrowDown', 40));
  }
}, 250);

const handleClick = (e: MouseEvent): void => {
  const active = activeElement();
  if (
    active &&
    testCollision(
      e.clientX,
      e.clientY,
      (active.lng as MainOnlyNode).coreNode.absX,
      (active.lng as MainOnlyNode).coreNode.absY,
      active.width,
      active.height,
    )
  ) {
    document.dispatchEvent(createKeyboardEvent('Enter', 13));
  }
};

function testCollision(
  px: number,
  py: number,
  cx: number,
  cy: number,
  cw: number = 0,
  ch: number = 0,
): boolean {
  return px >= cx && px <= cx + cw && py >= cy && py <= cy + ch;
}

function getChildrenByPosition(
  node: ElementNode,
  x: number,
  y: number,
): ElementNode[] {
  let result: ElementNode[] = [node];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child instanceof ElementNode) {
      if (
        child.alpha !== 0 &&
        testCollision(
          x,
          y,
          (child.lng as MainOnlyNode).coreNode.absX,
          (child.lng as MainOnlyNode).coreNode.absY,
          child.width,
          child.height,
        )
      ) {
        // continue searching tree
        result = [...result, ...getChildrenByPosition(child, x, y)];
      }
    }
  }

  return result;
}

export function useMouse(myApp: ElementNode = rootNode): void {
  const pos = useMousePosition();
  const scheduled = createScheduled((fn) => throttle(fn, 100));
  makeEventListener(window, 'wheel', handleScroll);
  makeEventListener(window, 'click', handleClick);
  createEffect(() => {
    if (scheduled()) {
      const result = getChildrenByPosition(myApp, pos.x, pos.y)
        .filter((el) => (el.focus || el.onFocus || el.onEnter) && !el.skipFocus)
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      if (result.length) {
        let activeElm = result[result.length - 1];

        while (activeElm) {
          const elmParent = activeElm.parent;
          if (elmParent?.forwardStates) {
            activeElm = activeElm.parent;
          } else {
            break;
          }
        }

        const activeElmParent = activeElm?.parent;
        if (activeElm && activeElmParent?.selected !== undefined) {
          activeElmParent.selected =
            activeElmParent.children.indexOf(activeElm);
        }

        setActiveElement(activeElm);
      }
    }
  });
}
