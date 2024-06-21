import { ElementNode, Styles, TextNode } from '@lightningtv/core';
import { JSXElement } from 'solid-js';
import { createRenderer } from 'solid-js/universal';

export type SolidRendererOptions = Parameters<
  typeof createRenderer<SolidNode>
>[0];

export type SolidNode = ElementNode | TextNode;

export type SolidStyles = Styles;

declare module '@lightningtv/core' {
  interface TextNode {
    _queueDelete?: boolean;
  }

  interface IntrinsicNodeProps {
    children?: JSXElement | undefined;
  }
}
