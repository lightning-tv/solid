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
import * as s from 'solid-js';

declare module '@lightningtv/core' {
  interface ElementNode {
    /** @internal for managing series of insertions and deletions */
    _queueDelete?: number;
    _hasCleanup?: boolean;
    preserve?: boolean;
  }
}

let elementDeleteQueue: ElementNode[] = [];

function flushDeleteQueue(): void {
  for (let el of elementDeleteQueue) {
    if (Number(el._queueDelete) < 0) {
      if (el.preserve) {
        el.alpha = 0;
      } else {
        el.destroy();
      }
    } else {
      // inserted back, make it visible again
      el.alpha = 1;
    }
    el._queueDelete = undefined;
  }
  elementDeleteQueue.length = 0;
}

function pushDeleteQueue(node: ElementNode, n: number): void {
  if (node._queueDelete === undefined) {
    node._queueDelete = n;
    if (elementDeleteQueue.push(node) === 1) {
      queueMicrotask(flushDeleteQueue);
    }
  } else {
    node._queueDelete += n;
  }
}

Object.defineProperty(ElementNode.prototype, 'preserve', {
  get(): boolean | undefined {
    return this._preserve;
  },
  set(v: boolean) {
    this._preserve = v;
    if (v && !this._hasCleanup) {
      this._hasCleanup = true;
      s.onCleanup(this.destroy.bind(this));
    }
  },
});

export default {
  createElement(name: string): ElementNode {
    return new ElementNode(name);
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

    let prevParent = node.parent;
    parent.insertChild(node, anchor);

    if (node instanceof ElementNode) {
      node.parent!.rendered && node.render(true);
      if (prevParent !== undefined) {
        pushDeleteQueue(node, 1);
      }
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

    if (node instanceof ElementNode) {
      pushDeleteQueue(node, -1);
    } else if (isElementText(parent)) {
      // TextNodes can be placed outside of <text> nodes when <Show> is used as placeholder
      parent.text = parent.getText();
    }
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
