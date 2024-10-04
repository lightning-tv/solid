/* eslint-disable @typescript-eslint/no-namespace */
import type { NodeProps, TextProps, ElementNode } from '@lightningtv/core';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      node: NodeProps;
      view: NodeProps;
      text: TextProps;
    }

    interface IntrinsicAttributes extends ElementNode {}
  }
}
