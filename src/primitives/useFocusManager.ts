import {
  activeElement,
  ElementNode,
  isFunc,
  isArray,
} from '@lightningtv/solid';
import { createEffect, createSignal, on, onCleanup, untrack } from 'solid-js';
import { type Accessor } from 'solid-js';
import { makeEventListener } from '@solid-primitives/event-listener';
import { useKeyDownEvent } from '@solid-primitives/keyboard';
import { createSingletonRoot } from '@solid-primitives/rootless';

export type KeyNameOrKeyCode = string | number;

export interface DefaultKeyMap {
  Left: KeyNameOrKeyCode | KeyNameOrKeyCode[];
  Right: KeyNameOrKeyCode | KeyNameOrKeyCode[];
  Up: KeyNameOrKeyCode | KeyNameOrKeyCode[];
  Down: KeyNameOrKeyCode | KeyNameOrKeyCode[];
  Enter: KeyNameOrKeyCode | KeyNameOrKeyCode[];
  Last: KeyNameOrKeyCode | KeyNameOrKeyCode[];
}

export interface DefaultKeyHoldMap {
  EnterHold: KeyNameOrKeyCode | KeyNameOrKeyCode[];
}

export interface KeyMap extends DefaultKeyMap {}

export interface KeyHoldMap extends DefaultKeyHoldMap {}

export type KeyHandlerReturn = boolean | void;

export type KeyHandler = (
  this: ElementNode,
  e: KeyboardEvent,
  target: ElementNode,
  handlerElm: ElementNode,
) => KeyHandlerReturn;

/**
 * Generates a map of event handlers for each key in the KeyMap
 */
type KeyMapEventHandlers = {
  [K in keyof KeyMap as `on${Capitalize<K>}`]?: KeyHandler;
};
type KeyHoldMapEventHandlers = {
  [K in keyof KeyHoldMap as `on${Capitalize<K>}`]?: KeyHandler;
};

declare module '@lightningtv/solid' {
  /**
   * Augment the existing IntrinsicCommonProps interface with our own
   * FocusManager-specific properties.
   */
  interface IntrinsicCommonProps
    extends KeyMapEventHandlers,
      KeyHoldMapEventHandlers {
    onFocus?: (
      currentFocusedElm: ElementNode | undefined,
      prevFocusedElm: ElementNode | undefined,
    ) => void;
    onFocusChanged?: (
      hasFocus: boolean,
      currentFocusedElm: ElementNode | undefined,
      prevFocusedElm: ElementNode | undefined,
    ) => void;
    onBlur?: (
      currentFocusedElm: ElementNode | undefined,
      prevFocusedElm: ElementNode | undefined,
    ) => void;
    onKeyPress?: (
      this: ElementNode,
      e: KeyboardEvent,
      mappedKeyEvent: string | undefined,
      handlerElm: ElementNode,
      currentFocusedElm: ElementNode,
    ) => KeyHandlerReturn;
    onSelectedChanged?: (
      container: ElementNode,
      activeElm: ElementNode,
      selectedIndex: number | undefined,
      lastSelectedIndex: number | undefined,
    ) => void;
    skipFocus?: boolean;
    wrap?: boolean;
    plinko?: boolean;
  }

  interface IntrinsicNodeStyleProps {
    // TODO: Refactor states to use a $ prefix
    focus?: IntrinsicNodeStyleProps;
  }

  interface IntrinsicTextNodeStyleProps {
    // TODO: Refactor states to use a $ prefix
    focus?: IntrinsicTextNodeStyleProps;
  }

  interface TextNode {
    skipFocus?: undefined;
  }
}

const keyMapEntries: Record<KeyNameOrKeyCode, string> = {
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  Enter: 'Enter',
  l: 'Last',
  ' ': 'Space',
  Backspace: 'Back',
  Escape: 'Escape',
};

const keyHoldMapEntries: Record<KeyNameOrKeyCode, string> = {
  Enter: 'EnterHold',
};

const DEFAULT_KEY_HOLD_THRESHOLD = 150; // ms

/**
 * holdThreshold is in milliseconds.
 */
export type KeyHoldOptions = {
  userKeyHoldMap: Partial<KeyHoldMap>;
  holdThreshold?: number;
};

const [focusPath, setFocusPath] = createSignal<ElementNode[]>([]);
export { focusPath };

// copy of useKeyDownEvent but for keyup
const useKeyUpEvent = /*#__PURE__*/ createSingletonRoot<
  Accessor<KeyboardEvent | null>
>(() => {
  const [event, setEvent] = createSignal<KeyboardEvent | null>(null);

  makeEventListener(window, 'keyup', (e) => {
    setEvent(e);
    setTimeout(() => setEvent(null));
  });

  return event;
});

export const useFocusManager = (
  userKeyMap?: Partial<KeyMap>,
  keyHoldOptions?: KeyHoldOptions,
) => {
  const keypressEvent = useKeyDownEvent();
  const keyupEvent = useKeyUpEvent();
  const keyHoldTimeouts: { [key: KeyNameOrKeyCode]: number } = {};

  // clear out any leftover timeouts
  onCleanup(() => {
    for (const [_, timeout] of Object.entries(keyHoldTimeouts)) {
      if (timeout) clearTimeout(timeout);
    }
  });

  if (userKeyMap) {
    // Flatten the userKeyMap to a hash
    for (const [key, value] of Object.entries(userKeyMap)) {
      if (isArray(value)) {
        value.forEach((v) => {
          keyMapEntries[v] = key;
        });
      } else {
        keyMapEntries[value] = key;
      }
    }
  }
  if (keyHoldOptions?.userKeyHoldMap) {
    // same as above
    for (const [key, value] of Object.entries(keyHoldOptions?.userKeyHoldMap)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (isArray(value)) {
        for (const v of value) {
          keyHoldMapEntries[v] = key;
        }
      } else {
        keyHoldMapEntries[value] = key;
      }
    }
  }
  createEffect(
    on(
      activeElement as Accessor<ElementNode>,
      (
        currentFocusedElm: ElementNode,
        prevFocusedElm: ElementNode | undefined,
        prevFocusPath: ElementNode[] = [],
      ) => {
        let current = currentFocusedElm;

        const fp: ElementNode[] = [];
        while (current) {
          // Always call Focus on activeElement in case user called setFocus() - Useful for Rows / Columns that have had children
          // changed and we can retrigger forwarding focus to newly added children
          if (!current.states.has('focus') || current === currentFocusedElm) {
            current.states.add('focus');
            isFunc(current.onFocus) &&
              current.onFocus.call(current, currentFocusedElm, prevFocusedElm);
            isFunc(current.onFocusChanged) &&
              current.onFocusChanged.call(
                current,
                true,
                currentFocusedElm,
                prevFocusedElm,
              );
          }
          fp.push(current);
          current = current.parent!;
        }

        prevFocusPath.forEach((elm) => {
          if (!fp.includes(elm)) {
            elm.states.remove('focus');
            isFunc(elm.onBlur) &&
              elm.onBlur.call(elm, currentFocusedElm, prevFocusedElm);
            isFunc(elm.onFocusChanged) &&
              elm.onFocusChanged.call(
                elm,
                false,
                currentFocusedElm,
                prevFocusedElm,
              );
          }
        });

        setFocusPath(fp);
        return fp;
      },
      { defer: true },
    ),
  );

  const propagateKeyDown = (
    e: KeyboardEvent,
    mappedEvent: string | undefined,
    isHold = false,
  ) => {
    untrack(() => {
      const fp = focusPath();
      let finalFocusElm: ElementNode | undefined = undefined;
      for (const elm of fp) {
        finalFocusElm = finalFocusElm || elm;
        if (mappedEvent) {
          const onKeyHandler =
            elm[`on${mappedEvent}` as keyof KeyMapEventHandlers];
          if (isFunc(onKeyHandler)) {
            if (onKeyHandler.call(elm, e, elm, finalFocusElm) === true) {
              break;
            }
          }
        } else {
          console.log(`Unhandled key event: ${e.key || e.keyCode}`);
        }
        const fallbackFunction = isHold ? elm.onKeyPress : elm.onKeyHold;
        if (isFunc(fallbackFunction)) {
          if (
            (fallbackFunction as any).call(
              elm,
              e,
              mappedEvent,
              elm,
              finalFocusElm,
            ) === true
          ) {
            break;
          }
        }
      }
      return false;
    });
  };

  const keyHoldCallback = (
    e: KeyboardEvent,
    mappedKeyHoldEvent: string | undefined,
  ) => {
    delete keyHoldTimeouts[e.key || e.keyCode];
    propagateKeyDown(e, mappedKeyHoldEvent, true);
  };

  createEffect(() => {
    const keypress = keypressEvent();
    const keyup = keyupEvent();

    if (keypress) {
      const key: KeyNameOrKeyCode = keypress.key || keypress.keyCode;
      const mappedKeyHoldEvent = keyHoldMapEntries[key];
      const mappedKeyEvent = keyMapEntries[key];
      if (!mappedKeyHoldEvent) {
        // just a regular key press
        propagateKeyDown(keypress, mappedKeyEvent, false);
      } else {
        const delay =
          keyHoldOptions?.holdThreshold || DEFAULT_KEY_HOLD_THRESHOLD;
        if (keyHoldTimeouts[key]) {
          // recieved two keydown events without a keyup in between
          clearTimeout(keyHoldTimeouts[key]);
        }
        keyHoldTimeouts[key] = setTimeout(
          () => keyHoldCallback(keypress, mappedKeyHoldEvent),
          delay,
        );
      }
    }
    if (keyup) {
      const key: KeyNameOrKeyCode = keyup.key || keyup.keyCode;
      const mappedKeyEvent = keyMapEntries[key];
      if (keyHoldTimeouts[key]) {
        clearTimeout(keyHoldTimeouts[key]);
        delete keyHoldTimeouts[key];
        propagateKeyDown(keyup, mappedKeyEvent, false);
      }
    }
  });

  return focusPath;
};
