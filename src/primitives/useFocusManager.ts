import {
  createEffect,
  on,
  createSignal,
  untrack,
  type Accessor,
} from 'solid-js';
import { useKeyDownEvent } from '@solid-primitives/keyboard';
import {
  activeElement,
  ElementNode,
  isFunc,
  isArray,
} from '@lightningtv/solid';

export interface DefaultKeyMap {
  Left: string | number | (string | number)[];
  Right: string | number | (string | number)[];
  Up: string | number | (string | number)[];
  Down: string | number | (string | number)[];
  Enter: string | number | (string | number)[];
  Last: string | number | (string | number)[];
}

export interface KeyMap extends DefaultKeyMap {}

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

declare module '@lightningtv/solid' {
  /**
   * Augment the existing IntrinsicCommonProps interface with our own
   * FocusManager-specific properties.
   */
  interface IntrinsicCommonProps extends KeyMapEventHandlers {
    onFocus?: (
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

const keyMapEntries: Record<string | number, string> = {
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

const [focusPath, setFocusPath] = createSignal<ElementNode[]>([]);
export { focusPath };
export const useFocusManager = (userKeyMap?: Partial<KeyMap>) => {
  const keypressEvent = useKeyDownEvent();
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
  createEffect(
    on(
      activeElement as Accessor<ElementNode>,
      (
        currentFocusedElm: ElementNode,
        prevFocusedElm: ElementNode | undefined,
        prevFocusPath: ElementNode[] = [],
      ) => {
        const newFocusedElms = [];
        let current = currentFocusedElm;

        const fp: ElementNode[] = [];
        while (current) {
          if (!current.states.has('focus')) {
            current.states.add('focus');
            isFunc(current.onFocus) &&
              current.onFocus.call(current, currentFocusedElm, prevFocusedElm);

            newFocusedElms.push(current);
          }
          fp.push(current);
          current = current.parent!;
        }

        prevFocusPath.forEach((elm) => {
          if (!fp.includes(elm)) {
            elm.states.remove('focus');
            isFunc(elm.onBlur) &&
              elm.onBlur.call(elm, currentFocusedElm, prevFocusedElm);
          }
        });

        setFocusPath(fp);
        return fp;
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    const e = keypressEvent();

    if (e) {
      // Search keyMap for the value of the pressed key or keyCode if value undefined
      const mappedKeyEvent = keyMapEntries[e.key] || keyMapEntries[e.keyCode];
      untrack(() => {
        const fp = focusPath();
        let finalFocusElm: ElementNode | undefined = undefined;
        for (const elm of fp) {
          finalFocusElm = finalFocusElm || elm;
          if (mappedKeyEvent) {
            const onKeyHandler =
              elm[`on${mappedKeyEvent}` as keyof KeyMapEventHandlers];
            if (isFunc(onKeyHandler)) {
              if (onKeyHandler.call(elm, e, elm, finalFocusElm) === true) {
                break;
              }
            }
          } else {
            console.log(`Unhandled key event: ${e.key || e.keyCode}`);
          }

          if (isFunc(elm.onKeyPress)) {
            if (
              elm.onKeyPress.call(
                elm,
                e,
                mappedKeyEvent,
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
    }
  });

  return focusPath;
};
