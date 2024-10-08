import {
  ElementNode,
  type Styles,
  type ElementText,
  TextNode,
} from '@lightningtv/core';
import type { JSXElement } from 'solid-js';
import { createRenderer } from 'solid-js/universal';

export type SolidRendererOptions = Parameters<
  typeof createRenderer<SolidNode>
>[0];

export type SolidNode = ElementNode | ElementText | TextNode;

export type SolidStyles = Styles;

declare module '@lightningtv/core' {
  interface NodeProps {
    children?: JSXElement | undefined;
  }

  interface TextProps {
    children?: string | string[] | undefined;
  }
}
