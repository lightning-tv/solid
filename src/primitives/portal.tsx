import { rootNode, type ElementNode, insert } from '@lightningtv/solid';
import { createEffect, createMemo, createRoot, createSignal, getOwner, JSX, onCleanup, runWithOwner } from 'solid-js';

export function Portal(props: { mount?: string; children: JSX.Element }) {
  let content: undefined | (() => JSX.Element);
  const mount = () => getMount(props.mount);
  const owner = getOwner();

  function getMount(mount?: string): ElementNode {
    if (!mount) return rootNode;
    return rootNode.searchChildrenById(mount) || rootNode;
  }

  createEffect(
    () => {
      const [clean, setClean] = createSignal(false);
      const cleanup = () => setClean(true);
      content || (content = runWithOwner(owner, () => createMemo(() => props.children)));
      createRoot(dispose => insert(mount(), () => (!clean() ? content!() : dispose()), null));
      onCleanup(cleanup);
    }
  );

  return null;
}
