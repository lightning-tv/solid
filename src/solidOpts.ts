import { assertTruthy } from '@lightningjs/renderer/utils';
import type { SolidNode, TextNode } from '@lightningtv/core';
import { ElementNode, NodeTypes, log } from '@lightningtv/core';
import type { createRenderer } from 'solid-js/universal';

export type SolidRendererOptions = Parameters<
  typeof createRenderer<SolidNode>
>[0];

export default {
  createElement(name: string): ElementNode {
    return new ElementNode(name);
  },
  createTextNode(text: string): TextNode {
    // A text node is just a string - not the <text> node
    return { type: NodeTypes.Text, text, parent: undefined };
  },
  replaceText(node: TextNode, value: string): void {
    log('Replace Text: ', node, value);
    node.text = value;
    const parent = node.parent;
    assertTruthy(parent);
    parent.text = parent.getText();
  },
  setProperty(node: ElementNode, name: string, value: any = true): void {
    node[name] = value;
  },
  insertNode(parent: ElementNode, node: SolidNode, anchor: SolidNode): void {
    log('INSERT: ', parent, node, anchor);

    parent.children.insert(node, anchor);
    node._queueDelete = false;

    if (node instanceof ElementNode) {
      parent.rendered && node.render();
    } else if (parent.isTextNode()) {
      // TextNodes can be placed outside of <text> nodes when <Show> is used as placeholder
      parent.text = parent.getText();
    }
  },
  isTextNode(node: ElementNode): boolean {
    return node.isTextNode();
  },
  removeNode(parent: ElementNode, node: SolidNode): void {
    log('REMOVE: ', parent, node);
    parent.children.remove(node);
    node._queueDelete = true;
    if (node instanceof ElementNode) {
      // Solid replacesNodes to move them (via insert and remove),
      // so we need to wait for the next microtask to destroy the node
      // in the event it gets a new parent.
      queueMicrotask(() => node.destroy());
    }
  },
  getParentNode(node: SolidNode): ElementNode | undefined {
    return node.parent;
  },
  getFirstChild(node: ElementNode): SolidNode | undefined {
    return node.children[0];
  },
  getNextSibling(node: SolidNode): SolidNode | undefined {
    const children = node.parent!.children || [];
    const index = children.indexOf(node) + 1;
    if (index < children.length) {
      return children[index];
    }
    return undefined;
  },
} satisfies SolidRendererOptions;
