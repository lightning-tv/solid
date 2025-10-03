import type { ElementText, INode, TextNode } from '@lightningtv/core';
import {
  ElementNode,
  activeElement,
  isElementNode,
  isTextNode,
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

let scrollTimeout: number;
const handleScroll = throttle((e: WheelEvent): void => {
  const deltaY = e.deltaY;
  if (deltaY < 0) {
    document.body.dispatchEvent(createKeyboardEvent('ArrowUp', 38));
  } else if (deltaY > 0) {
    document.body.dispatchEvent(createKeyboardEvent('ArrowDown', 40));
  }

  // clear the last timeout if the user is still scrolling
  clearTimeout(scrollTimeout);
  // after 250ms of no scroll events, we send a keyup event to stop the scrolling
  scrollTimeout = setTimeout(() => {
    document.body.dispatchEvent(createKeyboardEvent('ArrowUp', 38, 'keyup'));
    document.body.dispatchEvent(createKeyboardEvent('ArrowDown', 40, 'keyup'));
  }, 250);
}, 250);

const handleClick = (e: MouseEvent): void => {
  const active = activeElement();
  const precision = Config.rendererOptions?.deviceLogicalPixelRatio || 1;
  if (
    active instanceof ElementNode &&
    testCollision(
      e.clientX,
      e.clientY,
      ((active.lng.absX as number) || 0) * precision,
      ((active.lng.absY as number) || 0) * precision,
      (active.width || 0) * precision,
      (active.height || 0) * precision,
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
  let queue: (ElementNode | ElementText | TextNode)[] = [node];

  while (queue.length > 0) {
    // Process nodes at the current level
    const currentLevelNodes: ElementNode[] = [];

    for (const currentNode of queue) {
      if (
        isElementNode(currentNode) &&
        currentNode.alpha !== 0 &&
        !currentNode.skipFocus &&
        testCollision(
          x,
          y,
          ((currentNode.lng.absX as number) || 0) * precision,
          ((currentNode.lng.absY as number) || 0) * precision,
          (currentNode.width || 0) * precision,
          (currentNode.height || 0) * precision,
        )
      ) {
        currentLevelNodes.push(currentNode);
      }
    }

    const size = currentLevelNodes.length;
    if (size === 0) {
      break;
    }

    let highestZIndexNode = null;
    if (size === 1) {
      highestZIndexNode = currentLevelNodes[0];
    } else {
      let maxZIndex = -1;

      for (const node of currentLevelNodes) {
        const zIndex = node.zIndex ?? -1;
        if (zIndex > maxZIndex) {
          maxZIndex = zIndex;
          highestZIndexNode = node;
        } else if (zIndex === maxZIndex) {
          highestZIndexNode = node;
        }
      }
    }

    if (highestZIndexNode && !isTextNode(highestZIndexNode)) {
      result.push(highestZIndexNode);
      queue = highestZIndexNode.children;
    } else {
      queue = [];
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
        (el) => el.focus || el.onFocus || el.onEnter,
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
