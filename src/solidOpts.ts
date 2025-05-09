import * as s from 'solid-js';
import {
  assertTruthy,
  isElementText,
  ElementNode,
  NodeType,
  log,
  type ElementText,
  type TextNode,
} from '@lightningtv/core';
import type { SolidNode, SolidRendererOptions } from './types.js';

export default {
  createElement(name: string): ElementNode {
    let el = new ElementNode(name);

    let o = s.getOwner();
    if (o != null) {
      s.onCleanup(el.destroy.bind(el));
    }

    return el;
  },
  createTextNode(text: string): TextNode {
    // A text node is just a string - not the <text> node
    return { _type: NodeType.Text, text };
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

    parent.insertChild(node, anchor);
    node.parent = parent;

    if (node instanceof ElementNode) {
      node.parent!.rendered && node.render(true);
    } else if (isElementText(parent)) {
      // TextNodes can be placed outside of <text> nodes when <Show> is used as placeholder
      parent.text = parent.getText();
    }
  },
  isTextNode(node: SolidNode): boolean {
    return isElementText(node);
  },
  removeNode(parent: ElementNode, node: SolidNode): void {
    log('REMOVE: ', parent, node);

    parent.removeChild(node);
    node.parent = undefined;
  },
  getParentNode(node: SolidNode): ElementNode | ElementText | undefined {
    return node.parent;
  },
  getFirstChild(node: ElementNode): SolidNode | undefined {
    return node.children[0] as SolidNode;
  },
  getNextSibling(node: SolidNode): SolidNode | undefined {
    const children = node.parent!.children || [];
    const index = children.indexOf(node as any) + 1;
    if (index < children.length) {
      return children[index] as SolidNode;
    }
    return undefined;
  },
} satisfies SolidRendererOptions;
