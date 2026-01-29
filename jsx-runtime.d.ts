/* eslint-disable @typescript-eslint/no-namespace */
import type { NodeProps, TextProps } from './src/core/index.js';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      node: NodeProps;
      view: NodeProps;
      text: TextProps;
    }
  }
}

export type { JSX } from 'solid-js';
