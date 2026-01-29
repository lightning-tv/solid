import type { RendererMainSettings } from '@lightningjs/renderer';
import type {
  TextProps,
  AnimationSettings,
  DollarString,
} from './intrinsicTypes.js';
import { type ElementNode } from './elementNode.js';

/**
  STATIC LIGHTNING CONFIGURATION \
  Replace the values below with in your build system, \
  or set them in the global scope before importing lightning-core.
*/
declare global {
  /** Whether the DOM renderer should be used instead of `@lightningjs/renderer` */
  var LIGHTNING_DOM_RENDERING: boolean | undefined;
  /** Whether element shaders should be disabled */
  var LIGHTNING_DISABLE_SHADERS: boolean | undefined;

  /** Could be set by vite or other bundler */
  interface ImportMetaEnv {
    DEV: boolean;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export const isDev = !!(import.meta.env && import.meta.env.DEV);

/** Whether the DOM renderer is used instead of `@lightningjs/renderer` */
export const DOM_RENDERING =
  typeof LIGHTNING_DOM_RENDERING === 'boolean' && LIGHTNING_DOM_RENDERING;

/** Whether element shaders are enabled */
export const SHADERS_ENABLED = !(
  typeof LIGHTNING_DISABLE_SHADERS === 'boolean' && LIGHTNING_DISABLE_SHADERS
);

/**
  RUNTIME LIGHTNING CONFIGURATION \
  This configuration can be set at runtime, but it is recommended to set it
  before running any Lightning modules to ensure consistent behavior across the application.
*/
export interface Config {
  debug: boolean;
  focusDebug: boolean;
  domRendererEnabled: boolean;
  keyDebug: boolean;
  simpleAnimationsEnabled?: boolean;
  animationSettings?: AnimationSettings;
  animationsEnabled: boolean;
  fontSettings: Partial<TextProps>;
  rendererOptions?: Partial<RendererMainSettings>;
  setActiveElement: (elm: ElementNode) => void;
  focusStateKey: DollarString;
  lockStyles?: boolean;
  fontWeightAlias?: Record<string, number | string>;
  throttleInput?: number;
  taskDelay?: number;
}

export const Config: Config = {
  debug: false,
  domRendererEnabled: false,
  focusDebug: false,
  keyDebug: false,
  animationsEnabled: true,
  animationSettings: {
    duration: 250,
    easing: 'ease-in-out',
  },
  fontSettings: {
    fontFamily: 'Ubuntu',
    fontSize: 100,
  },
  fontWeightAlias: {
    thin: 100,
    light: 300,
    regular: '',
    400: '',
    medium: 500,
    bold: 700,
    black: 900,
  },
  setActiveElement: () => {},
  focusStateKey: '$focus',
  lockStyles: true,
};
