import * as lngr from '@lightningjs/renderer';
import * as lngr_shaders from '@lightningjs/renderer/webgl/shaders';

import type {
  RoundedProps as ShaderRoundedProps,
  ShadowProps as ShaderShadowProps,
  HolePunchProps as ShaderHolePunchProps,
  RadialGradientProps as ShaderRadialGradientProps,
  LinearGradientProps as ShaderLinearGradientProps,
} from '@lightningjs/renderer';
export {
  ShaderRoundedProps,
  ShaderShadowProps,
  ShaderHolePunchProps,
  ShaderRadialGradientProps,
  ShaderLinearGradientProps,
};

import { type WebGlShaderType as WebGlShader } from '@lightningjs/renderer/webgl';
export { WebGlShader };

import { type IRendererShaderManager } from './lightningInit.js';
import { DOM_RENDERING, SHADERS_ENABLED } from './config.js';

export type Vec4 = [x: number, y: number, z: number, w: number];

export interface ShaderBorderProps extends lngr.BorderProps {
  /** Distance between the border and element edges. */
  gap: number;
  /**
   * If `false`, the border is drawn outside the element. \
   * If `true`, the border is drawn inside the element.
   * @default true
   */
  inset: boolean;
}

export type ShaderBorderPrefixedProps = {
  [P in keyof ShaderBorderProps as `border-${P}`]: ShaderBorderProps[P];
};
export type ShaderShadowPrefixedProps = {
  [P in keyof ShaderShadowProps as `shadow-${P}`]: ShaderShadowProps[P];
};

export type ShaderRoundedWithShadowProps = ShaderRoundedProps &
  ShaderShadowPrefixedProps;
export type ShaderRoundedWithBorderProps = ShaderRoundedProps &
  ShaderBorderPrefixedProps;
export type ShaderRoundedWithBorderAndShadowProps = ShaderRoundedProps &
  ShaderShadowPrefixedProps &
  ShaderBorderPrefixedProps;

export type ShaderRounded = WebGlShader<ShaderRoundedProps>;
export type ShaderShadow = WebGlShader<ShaderShadowProps>;
export type ShaderRoundedWithBorder = WebGlShader<ShaderRoundedWithBorderProps>;
export type ShaderRoundedWithShadow = WebGlShader<ShaderRoundedWithShadowProps>;
export type ShaderRoundedWithBorderAndShadow =
  WebGlShader<ShaderRoundedWithBorderAndShadowProps>;
export type ShaderHolePunch = WebGlShader<ShaderHolePunchProps>;
export type ShaderRadialGradient = WebGlShader<ShaderRadialGradientProps>;
export type ShaderLinearGradient = WebGlShader<ShaderLinearGradientProps>;

export const defaultShaderRounded: ShaderRounded = lngr_shaders.Rounded;
export const defaultShaderShadow: ShaderShadow = lngr_shaders.Shadow;
export const defaultShaderRoundedWithShadow: ShaderRoundedWithShadow =
  lngr_shaders.RoundedWithShadow;
// TODO: lngr_shaders.RoundedWithBorderAndShadow doesn't support border-gap
export const defaultShaderRoundedWithBorderAndShadow =
  lngr_shaders.RoundedWithBorderAndShadow as ShaderRoundedWithBorderAndShadow;
export const defaultShaderHolePunch: ShaderHolePunch = lngr_shaders.HolePunch;
export const defaultShaderRadialGradient: ShaderRadialGradient =
  lngr_shaders.RadialGradient;
export const defaultShaderLinearGradient: ShaderLinearGradient =
  lngr_shaders.LinearGradient;

export const defaultShaderRoundedWithBorder =
  lngr_shaders.RoundedWithBorder as ShaderRoundedWithBorder;

function calcFactoredRadiusArray(
  radius: Vec4,
  width: number,
  height: number,
  out: Vec4 = [0, 0, 0, 0],
): Vec4 {
  [out[0], out[1], out[2], out[3]] = radius;
  let factor = Math.min(
    width / Math.max(width, radius[0] + radius[1]),
    width / Math.max(width, radius[2] + radius[3]),
    height / Math.max(height, radius[0] + radius[3]),
    height / Math.max(height, radius[1] + radius[2]),
    1,
  );
  out[0] *= factor;
  out[1] *= factor;
  out[2] *= factor;
  out[3] *= factor;
  return out;
}

function toValidVec4(value: unknown): Vec4 {
  if (typeof value === 'number') {
    return [value, value, value, value];
  }
  if (Array.isArray(value)) {
    switch (value.length) {
      default:
      case 4:
        return value as Vec4;
      case 3:
        return [value[0], value[1], value[2], value[0]];
      case 2:
        return [value[0], value[1], value[0], value[1]];
      case 1:
        return [value[0], value[0], value[0], value[0]];
      case 0:
        break;
    }
  }
  return [0, 0, 0, 0];
}

const roundedWithBorderProps: lngr.ShaderProps<ShaderRoundedWithBorderProps> = {
  radius: {
    default: [0, 0, 0, 0],
    resolve(value) {
      return toValidVec4(value);
    },
  },
  'border-align': 0,
  'top-left': {
    default: 0,
    set(value, props) {
      (props.radius as Vec4)[0] = value;
    },
    get(props) {
      return (props.radius as Vec4)[0];
    },
  },
  'top-right': {
    default: 0,
    set(value, props) {
      (props.radius as Vec4)[1] = value;
    },
    get(props) {
      return (props.radius as Vec4)[1];
    },
  },
  'bottom-right': {
    default: 0,
    set(value, props) {
      (props.radius as Vec4)[2] = value;
    },
    get(props) {
      return (props.radius as Vec4)[2];
    },
  },
  'bottom-left': {
    default: 0,
    set(value, props) {
      (props.radius as Vec4)[3] = value;
    },
    get(props) {
      return (props.radius as Vec4)[3];
    },
  },
  'border-w': {
    default: [0, 0, 0, 0],
    resolve(value) {
      return toValidVec4(value);
    },
  },
  'border-color': 0xffffffff,
  'border-gap': 0,
  'border-top': {
    default: 0,
    set(value, props) {
      (props['border-w'] as Vec4)[0] = value;
    },
    get(props) {
      return (props['border-w'] as Vec4)[0];
    },
  },
  'border-right': {
    default: 0,
    set(value, props) {
      (props['border-w'] as Vec4)[1] = value;
    },
    get(props) {
      return (props['border-w'] as Vec4)[1];
    },
  },
  'border-bottom': {
    default: 0,
    set(value, props) {
      (props['border-w'] as Vec4)[2] = value;
    },
    get(props) {
      return (props['border-w'] as Vec4)[2];
    },
  },
  'border-left': {
    default: 0,
    set(value, props) {
      (props['border-w'] as Vec4)[3] = value;
    },
    get(props) {
      return (props['border-w'] as Vec4)[3];
    },
  },
  'border-inset': true,
};

export function registerDefaultShaderRounded(
  shManager: IRendererShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('rounded', defaultShaderRounded);
}
export function registerDefaultShaderShadow(shManager: IRendererShaderManager) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('shadow', defaultShaderShadow);
}
export function registerDefaultShaderRoundedWithBorder(
  shManager: IRendererShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType(
      'roundedWithBorder',
      defaultShaderRoundedWithBorder,
    );
}
export function registerDefaultShaderRoundedWithShadow(
  shManager: IRendererShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType(
      'roundedWithShadow',
      defaultShaderRoundedWithShadow,
    );
}
export function registerDefaultShaderRoundedWithBorderAndShadow(
  shManager: IRendererShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType(
      'roundedWithBorderWithShadow',
      defaultShaderRoundedWithBorderAndShadow,
    );
}
export function registerDefaultShaderHolePunch(
  shManager: IRendererShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('holePunch', defaultShaderHolePunch);
}
export function registerDefaultShaderRadialGradient(
  shManager: IRendererShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('radialGradient', defaultShaderRadialGradient);
}
export function registerDefaultShaderLinearGradient(
  shManager: IRendererShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('linearGradient', defaultShaderLinearGradient);
}

export function registerDefaultShaders(shManager: IRendererShaderManager) {
  if (SHADERS_ENABLED && !DOM_RENDERING) {
    registerDefaultShaderRounded(shManager);
    registerDefaultShaderShadow(shManager);
    registerDefaultShaderRoundedWithBorder(shManager);
    registerDefaultShaderRoundedWithShadow(shManager);
    registerDefaultShaderRoundedWithBorderAndShadow(shManager);
    registerDefaultShaderHolePunch(shManager);
    registerDefaultShaderRadialGradient(shManager);
    registerDefaultShaderLinearGradient(shManager);
  }
}
