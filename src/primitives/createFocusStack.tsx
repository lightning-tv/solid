/**
 * Focus Stack Utility
 *
 * This utility manages a stack of focused elements, allowing for easy restoration
 * of the previous focus state when navigating through a UI.
 *
 * Usage:
 * ```ts
 * const { storeFocus, restoreFocus, clearFocusStack } = useFocusStack();
 * storeFocus(element); // Store the currently focused element
 * const success = restoreFocus(); // Restore the last stored focus and return success status
 * clearFocusStack(); // Empty the focus stack
 * ```
 *
 * Functions:
 * - `storeFocus(element: ElementNode, prevElement?: ElementNode)`: Stores the provided element in the focus stack.
 * - `restoreFocus()`: Restores focus to the last stored element and removes it from the stack. Returns `true` if successful, `false` otherwise.
 * - `clearFocusStack()`: Empties the focus stack.
 */
import { createSignal, createContext, useContext, JSX } from 'solid-js';
import { type ElementNode } from '@lightningtv/solid';

interface FocusStackContextType {
  storeFocus: (element: ElementNode, prevElement?: ElementNode) => void;
  restoreFocus: () => boolean;
  clearFocusStack: () => void;
}

const FocusStackContext = createContext<FocusStackContextType | undefined>(undefined);

export function FocusStackProvider(props: { children: JSX.Element}) {
  const [_focusStack, setFocusStack] = createSignal<ElementNode[]>([]);

  function storeFocus(element: ElementNode, prevElement?: ElementNode) {
    setFocusStack((stack) => [...stack, prevElement || element]);
  }

  function restoreFocus(): boolean {
    let wasFocused = false;
    setFocusStack((stack) => {
      const prevElement = stack.pop();
      if (prevElement && typeof prevElement.setFocus === 'function') {
        prevElement.setFocus();
        wasFocused = true;
      }
      return [...stack];
    });
    return wasFocused;
  }

  function clearFocusStack() {
    setFocusStack([]);
  }

  return (
    <FocusStackContext.Provider value={{ storeFocus, restoreFocus, clearFocusStack }}>
      {props.children}
    </FocusStackContext.Provider>
  );
}

export function useFocusStack() {
  const context = useContext(FocusStackContext);
  if (!context) {
    throw new Error("useFocusStack must be used within a FocusStackProvider");
  }
  return context;
}
