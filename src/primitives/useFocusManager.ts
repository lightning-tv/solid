import {
  createEffect,
  on,
  createSignal,
  onCleanup,
  getOwner,
  runWithOwner,
} from 'solid-js';
import { Config } from '@lightningtv/core';
import type { ElementNode } from '@lightningtv/core';
import {
  useFocusManager as useFocusManagerCore,
  type KeyMap,
  type KeyHoldOptions,
} from '@lightningtv/core/focusManager';
import { activeElement, setActiveElement } from '../activeElement.js';

const [focusPath, setFocusPath] = createSignal<ElementNode[]>([]);
export { focusPath };

export const useFocusManager = (
  userKeyMap?: Partial<KeyMap>,
  keyHoldOptions?: KeyHoldOptions,
  propagatedUpKeys?: string[],
) => {
  const owner = getOwner();
  const ownerContext = runWithOwner.bind(this, owner);
  Config.setActiveElement = (activeElm) =>
    ownerContext(() => setActiveElement(activeElm));

  const { cleanup, focusPath: focusPathCore } = useFocusManagerCore({
    userKeyMap,
    propagatedUpKeys,
    keyHoldOptions,
    ownerContext,
  });

  createEffect(
    on(
      activeElement,
      () => {
        setFocusPath([...focusPathCore()]);
      },
      { defer: true },
    ),
  );

  onCleanup(cleanup);
};
