import type { INode } from '@lightningtv/core';
import {
  ElementNode,
  activeElement,
  isElementNode,
  rootNode,
  Config,
} from '@lightningtv/solid';
import { makeEventListener } from '@solid-primitives/event-listener';
import { useMousePosition } from '@solid-primitives/mouse';
import { createScheduled, throttle } from '@solid-primitives/scheduled';
import { createEffect } from 'solid-js';

function createKeyboardEvent(
  key: string,
  keyCode: number,
  eventName: string = 'keydown',
): KeyboardEvent {
  return new KeyboardEvent(eventName, {
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
    document.body.dispatchEvent(createKeyboardEvent('ArrowUp', 38));
  } else if (deltaY > 0) {
    document.body.dispatchEvent(createKeyboardEvent('ArrowDown', 40));
  }
}, 250);

const handleClick = (e: MouseEvent): void => {
  const active = activeElement();
  const precision = Config.rendererOptions?.deviceLogicalPixelRatio || 1;
  if (
    active &&
    testCollision(
      e.clientX,
      e.clientY,
      (typeof active.lng.absX === 'number' ? active.lng.absX : 0) * precision,
      (typeof active.lng.absY === 'number' ? active.lng.absY : 0) * precision,
      (active.width ?? 0) * precision,
      (active.height ?? 0) * precision,
    )
  ) {
    document.dispatchEvent(createKeyboardEvent('Enter', 13));
    setTimeout(
      () =>
        document.body.dispatchEvent(createKeyboardEvent('Enter', 13, 'keyup')),
      1,
    );
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
  const result: ElementNode[] = [];
  const precision = Config.rendererOptions?.deviceLogicalPixelRatio || 1;

  // Queue for BFS
  let queue: ElementNode[] = [node];

  while (queue.length > 0) {
    // Process nodes at the current level
    const currentLevelNodes: ElementNode[] = [];

    for (const currentNode of queue) {
      if (
        currentNode.alpha !== 0 &&
        testCollision(
          x,
          y,
          (typeof currentNode.lng.absX === 'number'
            ? currentNode.lng.absX
            : 0) * precision,
          (typeof currentNode.lng.absY === 'number'
            ? currentNode.lng.absY
            : 0) * precision,
          (currentNode.width ?? 0) * precision,
          (currentNode.height ?? 0) * precision,
        )
      ) {
        currentLevelNodes.push(currentNode);
      }
    }

    const size = currentLevelNodes.length;
    if (size === 0) {
      break;
    }
    const maxZIndex = currentLevelNodes.reduce((prev, current) =>
      (prev.zIndex ?? -1) > (current.zIndex ?? -1) ? prev : current,
    );

    const highestZIndexNode = currentLevelNodes
      .filter((e) => e.zIndex === maxZIndex.zIndex)
      .pop();

    if (highestZIndexNode) {
      result.push(highestZIndexNode);
    }
    if (!highestZIndexNode || highestZIndexNode.isTextNode()) {
      queue = [];
    } else {
      queue = highestZIndexNode.children.filter(isElementNode);
    }
  }

  return result;
}

export function useMouse(
  myApp: ElementNode = rootNode,
  throttleBy: number = 100,
): void {
  const pos = useMousePosition();
  const scheduled = createScheduled((fn) => throttle(fn, throttleBy));
  makeEventListener(window, 'wheel', handleScroll);
  makeEventListener(window, 'click', handleClick);
  createEffect(() => {
    if (scheduled()) {
      const result = getChildrenByPosition(myApp, pos.x, pos.y).filter(
        (el) => (el.focus || el.onFocus || el.onEnter) && !el.skipFocus,
      );

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

        // Update Row & Column Selected property
        const activeElmParent = activeElm?.parent;
        if (activeElm && activeElmParent?.selected !== undefined) {
          activeElmParent.selected =
            activeElmParent.children.indexOf(activeElm);
        }

        activeElm?.setFocus();
      }
    }
  });
}
