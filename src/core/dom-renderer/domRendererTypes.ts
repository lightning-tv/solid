import * as lng from '@lightningjs/renderer';
import { CoreAnimation } from '../intrinsicTypes.js';
import { EventEmitter } from '@lightningjs/renderer/utils';
import {
  ShaderBorderPrefixedProps,
  ShaderHolePunchProps,
  ShaderLinearGradientProps,
  ShaderRadialGradientProps,
  ShaderRoundedProps,
  ShaderShadowPrefixedProps,
} from '../shaders.js';

/** Based on {@link lng.CoreRenderer} */
export interface IRendererCoreRenderer {
  mode: 'canvas' | 'webgl' | undefined;
  boundsMargin?: number | [number, number, number, number];
}
/** Based on {@link lng.TrFontManager} */
export interface IRendererFontManager {
  addFontFace: (...a: any[]) => void;
}
/** Based on {@link lng.Stage} */
export interface IRendererStage {
  root: IRendererNode;
  renderer: IRendererCoreRenderer;
  shManager: IRendererShaderManager;
  animationManager: {
    registerAnimation: (anim: CoreAnimation) => void;
    unregisterAnimation: (anim: CoreAnimation) => void;
  };
  loadFont: lng.Stage['loadFont'];
  reprocessUpdates?: (callback?: () => void) => void;
  cleanup(full: boolean): void;
}

/** Based on {@link lng.CoreShaderManager} */
export interface IRendererShaderManager {
  registerShaderType: (name: string, shader: any) => void;
}

/** Based on {@link lng.CoreShaderType} */
export interface IRendererShaderType {}

export type IRendererShaderProps = Partial<ShaderBorderPrefixedProps> &
  Partial<ShaderShadowPrefixedProps> &
  Partial<ShaderRoundedProps> &
  Partial<ShaderHolePunchProps> &
  Partial<ShaderRadialGradientProps> &
  Partial<ShaderLinearGradientProps>;

/** Based on {@link lng.CoreShaderNode} */
export interface IRendererShader extends Partial<lng.CoreShaderType> {
  shaderType: IRendererShaderType;
  props?: IRendererShaderProps;
  program?: {};
}

export type ExtractProps<Type> = Type extends { z$__type__Props: infer Props }
  ? Props
  : never;

export interface IEventEmitter<
  T extends object = { [s: string]: (target: any, data: any) => void },
> {
  on<K extends keyof T>(event: Extract<K, string>, listener: T[K]): void;
  once<K extends keyof T>(event: Extract<K, string>, listener: T[K]): void;
  off<K extends keyof T>(event: Extract<K, string>, listener: T[K]): void;
  emit<K extends keyof T>(
    event: Extract<K, string>,
    data: Parameters<any>[1],
  ): void;
}

export interface IRendererNodeShaded extends EventEmitter {
  stage: IRendererStage;
  id: number;
  animate: (
    props: Partial<lng.INodeAnimateProps<any>>,
    settings: Partial<lng.AnimationSettings>,
  ) => lng.IAnimationController;
  get absX(): number;
  get absY(): number;
}

/** Based on {@link lng.INodeProps} */
export interface IRendererNodeProps
  extends Omit<lng.INodeProps, 'shader' | 'parent'> {
  shader: IRendererShader | null;
  parent: IRendererNode | null;
}

/** Based on {@link lng.CoreNode} */
export interface IRendererNode extends IRendererNodeShaded, IRendererNodeProps {
  div?: HTMLElement;
  props: IRendererNodeProps;
  renderState: lng.CoreNodeRenderState;
}

/** Based on {@link lng.ITextNodeProps} */
export interface IRendererTextNodeProps
  extends Omit<lng.ITextNodeProps, 'shader' | 'parent'> {
  shader: IRendererShader | null;
  parent: IRendererNode | null;
  fontWeight?: string;
  fontStretch?: string;
}

/** Based on {@link lng.ITextNode} */
export interface IRendererTextNode
  extends IRendererNodeShaded,
    IRendererTextNodeProps {
  div?: HTMLElement;
  props: IRendererTextNodeProps;
  renderState: lng.CoreNodeRenderState;
}

/** Based on {@link lng.RendererMain} */
export interface IRendererMain extends IEventEmitter {
  root: IRendererNode;
  stage: IRendererStage;
  canvas: HTMLCanvasElement;
  createTextNode(props: Partial<IRendererTextNodeProps>): IRendererTextNode;
  createNode(props: Partial<IRendererNodeProps>): IRendererNode;
  createShader: typeof lng.RendererMain.prototype.createShader;
  createTexture: typeof lng.RendererMain.prototype.createTexture;
  //createEffect: typeof lng.RendererMain.prototype.createEffect;
}
