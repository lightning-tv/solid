import * as debug from '@solid-devtools/debugger/types';
import * as lng from '@lightningtv/core';

const EMPTY_CHILDREN: (lng.ElementNode | lng.ElementText)[] = [];

/**
 * Implementation of the solid-devtools element interface for Lightning elements
 */
export const elementInterface: debug.ElementInterface<
  lng.ElementNode | lng.ElementText
> = {
  isElement(node): node is lng.ElementNode | lng.ElementText {
    return (
      '_type' in node &&
      (node._type === lng.NodeType.Element ||
        node._type === lng.NodeType.TextNode)
    );
  },
  getChildren(node) {
    return node instanceof lng.ElementNode ? node.children : EMPTY_CHILDREN;
  },
  getName(node) {
    return node._type === lng.NodeType.Element ? 'view' : 'text';
  },
  getParent(node) {
    return node.parent ?? null;
  },
  getRect(node) {
    let { width, height } = node;
    let x = 0,
      y = 0;

    if (node.scaleX != null) width *= node.scaleX;
    if (node.scaleY != null) height *= node.scaleY;

    let curr = node as lng.ElementNode | undefined | null;
    while (curr != null) {
      x += curr.x;
      y += curr.y;
      if (curr.scaleX != null) {
        x *= curr.scaleX;
        width *= curr.scaleX;
      }
      if (curr.scaleY != null) {
        y *= curr.scaleY;
        height *= curr.scaleY;
      }
      curr = curr.parent;
    }

    if (lng.Config.rendererOptions != null) {
      let dpr = lng.Config.rendererOptions.deviceLogicalPixelRatio;
      if (dpr != null) {
        x *= dpr;
        y *= dpr;
        width *= dpr;
        height *= dpr;
      }
    }

    return { x, y, width, height };
  },
  getElementAt(e) {
    let target = e.target as any;
    return target != null && target.element instanceof lng.ElementNode
      ? target.element
      : null;
  },
  getLocation(node) {
    if (typeof node['data-source-loc'] === 'string') {
      return debug.parseLocationString(node['data-source-loc']) ?? null;
    }
    return null;
  },
};
