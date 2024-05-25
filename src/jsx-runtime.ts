/* eslint-disable @typescript-eslint/no-namespace */
import type { IntrinsicNodeProps, IntrinsicTextProps } from '@lightningtv/core';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      node: Partial<IntrinsicNodeProps>;
      view: Partial<IntrinsicNodeProps>;
      text: Partial<IntrinsicTextProps>;
    }
  }
}
