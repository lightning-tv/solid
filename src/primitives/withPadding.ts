import type { ElementNode } from '@lightningtv/core';

export type withPaddingInput =
  | number
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];

// To use with TS import withPadding and then put withPadding; on the next line to prevent tree shaking
export function withPadding(el: ElementNode, padding: () => withPaddingInput) {
  const pad = padding();
  let top: number, left: number, right: number, bottom: number;

  if (Array.isArray(pad)) {
    // top right bottom left
    if (pad.length === 2) {
      top = bottom = pad[0]!;
      left = right = pad[1]!;
    } else if (pad.length === 3) {
      top = pad[0]!;
      left = right = pad[1]!;
      bottom = pad[2]!;
    } else {
      [top, right, bottom, left] = pad;
    }
  } else {
    top = right = bottom = left = pad;
  }

  el.onBeforeLayout = (node, size) => {
    if (size) {
      el.width =
        el.children.reduce((acc, child) => {
          const c = child as ElementNode;
          return acc + (c.width || 0);
        }, 0) +
        left +
        right;
      const firstChild = el.children[0] as ElementNode;
      if (firstChild) {
        // set padding or marginLeft for flex
        firstChild.x = left;
        firstChild.marginLeft = left;
      }

      let maxHeight = 0;
      el.children.forEach((child) => {
        const c = child as ElementNode;
        c.y = top;
        c.marginTop = top;
        maxHeight = Math.max(maxHeight, c.height || 0);
      });
      el.height = maxHeight + top + bottom;
      // let flex know we need to re-layout
      return true;
    }
  };
}
