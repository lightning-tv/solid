import type { ElementText, TextNode } from '@lightningtv/core';
import {
  Config,
  ElementNode,
  activeElement,
  isElementNode,
  isFunc,
  isTextNode,
  rootNode,
} from '@lightningtv/solid';
import { makeEventListener } from '@solid-primitives/event-listener';
import { useMousePosition } from '@solid-primitives/mouse';
import { createScheduled, throttle } from '@solid-primitives/scheduled';
import { createEffect } from 'solid-js';

type CustomState = `$${string}`;

type RenderableNode = ElementNode | ElementText | TextNode;

interface MouseStateOptions {
  hoverState: CustomState;
  pressedState: CustomState;
  pressedStateDuration?: number;
}

type UseMouseOptions =
  | { customStates: MouseStateOptions }
  | { customStates: undefined };

declare module '@lightningtv/core' {
  interface ElementNode {
    onEnter?: () => void;
    /** function to be called on mouse click */
    onMouseClick?: (
      this: ElementNode,
      event: MouseEvent,
      active: ElementNode,
    ) => void;
  }
}

const DEFAULT_PRESSED_STATE_DURATION = 150;

export function addCustomStateToElement(
  element: RenderableNode,
  state: CustomState,
): void {
  element.states?.add(state);
}

export function removeCustomStateFromElement(
  element: RenderableNode,
  state: CustomState,
): void {
  element.states?.remove(state);
}

export function hasCustomState(
  element: RenderableNode,
  state: CustomState,
): boolean {
  return element.states.has(state);
}

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

let scrollTimeout: ReturnType<typeof setTimeout>;
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

function findElementWithCustomState<TApp extends ElementNode>(
  myApp: TApp,
  x: number,
  y: number,
  customState: CustomState,
): ElementNode | undefined {
  const result = getChildrenByPosition(myApp, x, y).filter((el) =>
    hasCustomState(el, customState),
  );

  if (result.length === 0) {
    return undefined;
  }

  let element: ElementNode | undefined = result[result.length - 1];

  while (element) {
    const elmParent = element.parent;
    if (elmParent?.forwardStates && hasCustomState(elmParent, customState)) {
      element = elmParent;
    } else {
      break;
    }
  }

  return element;
}

function findElementByActiveElement(e: MouseEvent): ElementNode | null {
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
    return active;
  }

  let parent = active?.parent;
  while (parent) {
    if (
      isFunc(parent.onMouseClick) &&
      active &&
      testCollision(
        e.clientX,
        e.clientY,
        ((parent.lng.absX as number) || 0) * precision,
        ((parent.lng.absY as number) || 0) * precision,
        (parent.width || 0) * precision,
        (parent.height || 0) * precision,
      )
    ) {
      return parent;
    }
    parent = parent.parent;
  }

  return null;
}

function applyPressedState(
  element: ElementNode,
  pressedState: CustomState,
  pressedStateDuration: number = DEFAULT_PRESSED_STATE_DURATION,
): void {
  addCustomStateToElement(element, pressedState);
  setTimeout(() => {
    removeCustomStateFromElement(element, pressedState);
  }, pressedStateDuration);
}

function handleElementClick(
  clickedElement: ElementNode,
  e: MouseEvent,
  customStates?: MouseStateOptions,
): void {
  if (customStates) {
    applyPressedState(
      clickedElement,
      customStates.pressedState,
      customStates.pressedStateDuration,
    );
  }

  if (isFunc(clickedElement.onMouseClick)) {
    clickedElement.onMouseClick(e, clickedElement);
    return;
  }

  if (customStates && isFunc(clickedElement.onEnter)) {
    clickedElement.onEnter();
    return;
  }

  document.dispatchEvent(createKeyboardEvent('Enter', 13));
  setTimeout(
    () =>
      document.body.dispatchEvent(createKeyboardEvent('Enter', 13, 'keyup')),
    1,
  );
}

function createHandleClick<TApp extends ElementNode>(
  myApp: TApp,
  customStates?: MouseStateOptions,
) {
  return (e: MouseEvent): void => {
    const clickedElement = customStates
      ? findElementWithCustomState(
          myApp,
          e.clientX,
          e.clientY,
          customStates.hoverState,
        )
      : findElementByActiveElement(e);

    if (!clickedElement) {
      return;
    }

    handleElementClick(clickedElement, e, customStates);
  };
}

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

function isNodeAtPosition(
  node: ElementNode | ElementText | TextNode,
  x: number,
  y: number,
  precision: number,
): node is ElementNode {
  if (!isElementNode(node)) {
    return false;
  }

  return (
    node.alpha !== 0 &&
    !node.skipFocus &&
    testCollision(
      x,
      y,
      ((node.lng.absX as number) || 0) * precision,
      ((node.lng.absY as number) || 0) * precision,
      (node.width || 0) * precision,
      (node.height || 0) * precision,
    )
  );
}

function findHighestZIndexNode(nodes: ElementNode[]): ElementNode | undefined {
  if (nodes.length === 0) {
    return undefined;
  }

  if (nodes.length === 1) {
    return nodes[0];
  }

  let maxZIndex = -1;
  let highestNode: ElementNode | undefined = undefined;

  for (const node of nodes) {
    const zIndex = node.zIndex ?? -1;
    if (zIndex >= maxZIndex) {
      maxZIndex = zIndex;
      highestNode = node;
    }
  }

  return highestNode;
}

function getChildrenByPosition<TElement extends ElementNode = ElementNode>(
  node: TElement,
  x: number,
  y: number,
): TElement[] {
  const result: TElement[] = [];
  const precision = Config.rendererOptions?.deviceLogicalPixelRatio || 1;
  // Queue for BFS

  let queue: (ElementNode | ElementText | TextNode)[] = [node];

  while (queue.length > 0) {
    // Process nodes at the current level
    const currentLevelNodes = queue.filter((currentNode) =>
      isNodeAtPosition(currentNode, x, y, precision),
    );

    if (currentLevelNodes.length === 0) {
      break;
    }

    const highestZIndexNode = findHighestZIndexNode(currentLevelNodes);

    if (!highestZIndexNode || isTextNode(highestZIndexNode)) {
      break;
    }

    result.push(highestZIndexNode as TElement);
    queue = highestZIndexNode.children;
  }

  return result;
}

export function useMouse<TApp extends ElementNode = ElementNode>(
  myApp: TApp = rootNode as TApp,
  throttleBy: number = 100,
  options?: UseMouseOptions,
): void {
  const pos = useMousePosition();
  const scheduled = createScheduled((fn) => throttle(fn, throttleBy));
  let previousElement: ElementNode | null = null;
  const customStates = options?.customStates;
  const handleClick = createHandleClick(myApp, customStates);

  makeEventListener(window, 'wheel', handleScroll);
  makeEventListener(window, 'click', handleClick);
  createEffect(() => {
    if (scheduled()) {
      const result = getChildrenByPosition(myApp, pos.x, pos.y).filter(
        (el) => !!(el.focus || el.onFocus || el.onEnter),
      );

      if (result.length) {
        let activeElm: ElementNode | undefined = result[result.length - 1];

        while (activeElm) {
          const elmParent = activeElm.parent;
          if (elmParent?.forwardStates) {
            activeElm = elmParent;
          } else {
            break;
          }
        }

        if (!activeElm) {
          return;
        }

        // Update Row & Column Selected property
        const activeElmParent = activeElm.parent;
        if (activeElmParent?.selected !== undefined) {
          activeElmParent.selected =
            activeElmParent.children.indexOf(activeElm);
        }

        const hoverState = customStates?.hoverState;

        if (previousElement && previousElement !== activeElm && hoverState) {
          removeCustomStateFromElement(previousElement, hoverState);
        }

        if (hoverState) {
          addCustomStateToElement(activeElm, hoverState);
        } else {
          activeElm.setFocus();
        }

        previousElement = activeElm;
      } else if (previousElement && customStates?.hoverState) {
        removeCustomStateFromElement(previousElement, customStates.hoverState);
        previousElement = null;
      }
    }
  });
}
