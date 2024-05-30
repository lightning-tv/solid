import { View, rootNode, type ElementNode } from '@lightningtv/solid';
import { type JSXElement } from 'solid-js';

export function Portal(props: { mount?: string; children: JSXElement }) {
  function getMount(mount?: string): ElementNode {
    if (!mount) return rootNode;
    return rootNode.searchChildrenById(mount) || rootNode;
  }

  return <View parent={getMount(props.mount)}>{props.children}</View>;
}
