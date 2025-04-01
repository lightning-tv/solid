import * as lng from '@lightningtv/core';

export namespace JSX {
  interface ElementChildrenAttribute {
    children: {};
  }

  type Element =
    | lng.ElementNode
    | lng.ElementText
    | Element[]
    | (string & {})
    | null
    | undefined;

  interface IntrinsicElements {
    node: lng.NodeProps;
    view: lng.NodeProps;
    text: lng.TextProps;
  }

  interface IntrinsicAttributes
    extends lng.NewOmit<lng.NodeProps, 'children' | 'style'> {}
}
