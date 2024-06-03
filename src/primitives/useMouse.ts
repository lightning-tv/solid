import type { INode } from '@lightningjs/renderer';
import {
  ElementNode,
  activeElement,
  setActiveElement,
  rootNode,
  Config,
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
  const precision = Config.rendererOptions?.deviceLogicalPixelRatio || 1;
  if (
    active &&
    testCollision(
      e.clientX,
      e.clientY,
      (active.lng as MainOnlyNode).coreNode.absX * precision,
      (active.lng as MainOnlyNode).coreNode.absY * precision,
      active.width! * precision,
      active.height! * precision,
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
          (currentNode.lng as MainOnlyNode).coreNode.absX * precision,
          (currentNode.lng as MainOnlyNode).coreNode.absY * precision,
          currentNode.width! * precision,
          currentNode.height! * precision,
        )
      ) {
        currentLevelNodes.push(currentNode);
      }
    }

    const size = currentLevelNodes.length;
    if (size === 0) {
      break;
    } else if (size > 1) {
      // Find the node with the highest zIndex
      currentLevelNodes.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    }

    const highestZIndexNode = currentLevelNodes[0] as ElementNode;
    result.push(highestZIndexNode);
    if (highestZIndexNode.isTextNode()) {
      queue = [];
    } else {
      queue = highestZIndexNode.children as ElementNode[];
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
        let activeElm = result[result.length - 1] as ElementNode;

        while (activeElm.parent?.forwardStates) {
          activeElm = activeElm.parent;
        }

        // Update Row & Column Selected property
        const activeElmParent = activeElm.parent;
        if (activeElmParent?.selected !== undefined) {
          activeElmParent.selected =
            activeElmParent.children.indexOf(activeElm);
        }

        setActiveElement(activeElm);
      }
    }
  });
}
