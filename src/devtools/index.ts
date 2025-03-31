/*

 Implementation of the solid-devtools element interface for Lightning elements

*/

import * as debug from '@solid-devtools/debugger/types';
import * as lng from '@lightningtv/core';

export const elementInterface: debug.ElementInterface<
  lng.ElementNode | lng.ElementText | lng.TextNode
> = {
  isElement: (node): node is lng.ElementNode | lng.ElementText | lng.TextNode =>
    '_type' in node &&
    (node._type === lng.NodeType.Element ||
      node._type === lng.NodeType.TextNode ||
      node._type === lng.NodeType.Text),
  getChildren: (node) => node.children,
  getName: (node) => node._type,
  getParent: (node) => node.parent ?? null,
  getRect: (node) => {
    return null;
  },
  getElementAt: (node) => {
    return null;
  },
  getLocation: (node) => {
    return null;
  },
};
