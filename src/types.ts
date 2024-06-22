import { ElementNode, Styles, ElementText } from '@lightningtv/core';
import { JSXElement } from 'solid-js';
import { createRenderer } from 'solid-js/universal';

export type SolidRendererOptions = Parameters<
  typeof createRenderer<SolidNode>
>[0];

export type SolidNode = ElementNode | ElementText;

export type SolidStyles = Styles;

declare module '@lightningtv/core' {
  interface IntrinsicNodeProps {
    children?: JSXElement | undefined;
  }
}
