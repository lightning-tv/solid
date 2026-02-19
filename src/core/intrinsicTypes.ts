import * as lngr from '@lightningjs/renderer';
import { ElementNode, type RendererNode } from './elementNode.js';
import { NodeStates } from './states.js';
import {
  ShaderBorderProps,
  ShaderHolePunchProps,
  ShaderLinearGradientProps,
  ShaderRadialGradientProps,
  ShaderRoundedProps,
  ShaderShadowProps,
} from './shaders.js';
import {
  EventHandlers,
  DefaultKeyMap,
  KeyHoldMap,
  FocusNode,
} from './focusKeyTypes.js';
import type { JSXElement } from 'solid-js';

export type AnimationSettings = Partial<lngr.AnimationSettings>;

export type AddColorString<T> = {
  [K in keyof T]: K extends `color${string}` ? string | number : T[K];
};

export interface BorderStyleObject {
  width: number;
  color: number | string;
  gap?: number;
  fill?: number | string;
  align?: number | 'inside' | 'center' | 'outside';
}

export type DollarString = `$${string}`;
export type BorderStyle = BorderStyleObject;
export type BorderRadius = number | number[];

export interface Effects {
  linearGradient?: Partial<ShaderLinearGradientProps>;
  radialGradient?: Partial<ShaderRadialGradientProps>;
  holePunch?: Partial<ShaderHolePunchProps>;
  shadow?: Partial<ShaderShadowProps>;
  rounded?: Partial<ShaderRoundedProps>;
  borderRadius?: Partial<BorderRadius>;
  border?: Partial<ShaderBorderProps>;
}

export type StyleEffects = Effects;

export type CoreAnimation = Parameters<
  lngr.Stage['animationManager']['registerAnimation']
>[0];

export type FontLoadOptions = Parameters<lngr.Stage['loadFont']>[1] & {
  type?: 'ssdf' | 'msdf';
};

export type CoreShaderManager = lngr.Stage['shManager'];

export type NewOmit<T, K extends PropertyKey> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};

export type RemoveUnderscoreProps<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K];
};

type RendererText = AddColorString<
  Partial<Omit<lngr.ITextNodeProps, 'debug' | 'shader' | 'parent'>>
>;

type CleanElementNode = NewOmit<
  RemoveUnderscoreProps<ElementNode>,
  | 'parent'
  | 'insertChild'
  | 'removeChild'
  | 'selectedNode'
  | 'shader'
  | 'animate'
  | 'chain'
  | 'start'
  | 'isTextNode'
  | 'getText'
  | 'destroy'
  | 'hasChildren'
  | 'getChildById'
  | 'searchChildrenById'
  | 'states'
  | 'requiresLayout'
  | 'updateLayout'
  | 'render'
  | 'style'
>;
/** Node text, children of a ElementNode of type TextNode */
export interface ElementText
  extends NewOmit<
      ElementNode,
      '_type' | 'parent' | 'children' | 'src' | 'scale' | 'fontFamily'
    >,
    NewOmit<RendererText, 'x' | 'y' | 'w' | 'h'> {
  _type: 'textNode';
  parent?: ElementNode;
  children: TextNode[];
  text: string;
  style: TextStyles;
}

export interface TextNode {
  _type: 'text';
  parent?: ElementText;
  text: string;
  [key: string]: any;
}

export interface NodeProps
  extends RendererNode,
    EventHandlers<DefaultKeyMap>,
    EventHandlers<KeyHoldMap>,
    FocusNode,
    Partial<
      NewOmit<
        CleanElementNode,
        | 'children'
        | 'text'
        | 'lng'
        | 'rendered'
        | 'renderer'
        | 'emit'
        | 'preFlexwidth'
        | 'preFlexHeight'
      >
    > {
  states?: NodeStates;
  style?: NodeStyles;
  children?: JSXElement | undefined;
}
export interface NodeStyles extends NewOmit<NodeProps, 'style'> {
  [key: `$${string}`]: NodeProps;
}

export interface TextProps
  extends RendererText,
    Partial<
      NewOmit<
        CleanElementNode,
        | 'lng'
        | 'rendered'
        | 'renderer'
        | 'alignItems'
        | 'autosize'
        | 'children'
        | 'data'
        | 'direction'
        | 'display'
        | 'flexBoundary'
        | 'flexDirection'
        | 'gap'
        | 'justifyContent'
        | 'forwardFocus'
        | 'forwardStates'
        | 'linearGradient'
        | 'src'
        | 'scale'
        | 'texture'
        | 'textureOptions'
      >
    > {
  states?: NodeStates;
  fontWeight?: number | string;
  style?: TextStyles;
  children?: string | string[] | undefined;
}

export interface TextStyles extends NewOmit<TextProps, 'style'> {
  [key: `$${string}`]: TextProps;
}

export type Styles = NodeStyles | TextStyles;

// TODO: deprecated
export interface IntrinsicNodeProps extends NodeProps {}
export interface IntrinsicNodeStyleProps extends NodeStyles {}
export interface IntrinsicTextNodeStyleProps extends TextStyles {}

export type AnimationEvents = 'animating' | 'tick' | 'stopped';
export type AnimationEventHandler = (
  controller: lngr.IAnimationController,
  name: string,
  endValue: number,
  props?: any,
) => void;

type EventPayloadMap = {
  loaded: lngr.NodeLoadedPayload;
  failed: lngr.NodeFailedPayload;
  freed: Event;
  inBounds: Event;
  outOfBounds: Event;
  inViewport: Event;
  outOfViewport: Event;
};

type NodeEvents = keyof EventPayloadMap;

type EventHandler<E extends NodeEvents> = (
  target: ElementNode,
  event?: EventPayloadMap[E],
) => void;

export type OnEvent = Partial<{
  [K in NodeEvents]: EventHandler<K>;
}>;
