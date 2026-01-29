import {
  type ElementNode,
  type Styles,
  type ElementText,
  type TextNode,
} from './core/index.js';
import type { JSXElement } from 'solid-js';
import { createRenderer } from 'solid-js/universal';

export type SolidRendererOptions = Parameters<
  typeof createRenderer<SolidNode>
>[0];

export interface RenderedNode extends ElementNode {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type SolidNode = ElementNode | ElementText | TextNode;

export type SolidStyles = Styles;
