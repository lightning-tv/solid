import * as lngr from '@lightningjs/renderer';
import * as lngr_shaders from '@lightningjs/renderer/webgl/shaders';

import type {
  HolePunchProps as ShaderHolePunchProps,
  LinearGradientProps as ShaderLinearGradientProps,
  RadialGradientProps as ShaderRadialGradientProps,
  RoundedProps as ShaderRoundedProps,
  ShadowProps as ShaderShadowProps,
} from '@lightningjs/renderer';
import { type WebGlShaderType as WebGlShader } from '@lightningjs/renderer/webgl';
export {
  ShaderHolePunchProps,
  ShaderLinearGradientProps,
  ShaderRadialGradientProps,
  ShaderRoundedProps,
  ShaderShadowProps,
};
export { WebGlShader };

import { DOM_RENDERING, SHADERS_ENABLED } from './config.js';
import type { CoreShaderManager } from './intrinsicTypes.js';
import { IRendererShaderManager } from './dom-renderer/domRendererTypes.js';

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

export function registerDefaultShaderRounded(
  shManager: IRendererShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('rounded', defaultShaderRounded);
}
export function registerDefaultShaderShadow(shManager: CoreShaderManager) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('shadow', defaultShaderShadow);
}
export function registerDefaultShaderRoundedWithBorder(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType(
      'roundedWithBorder',
      defaultShaderRoundedWithBorder,
    );
}
export function registerDefaultShaderRoundedWithShadow(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType(
      'roundedWithShadow',
      defaultShaderRoundedWithShadow,
    );
}
export function registerDefaultShaderRoundedWithBorderAndShadow(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType(
      'roundedWithBorderWithShadow',
      defaultShaderRoundedWithBorderAndShadow,
    );
}
export function registerDefaultShaderHolePunch(shManager: CoreShaderManager) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('holePunch', defaultShaderHolePunch);
}
export function registerDefaultShaderRadialGradient(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('radialGradient', defaultShaderRadialGradient);
}
export function registerDefaultShaderLinearGradient(
  shManager: CoreShaderManager,
) {
  if (SHADERS_ENABLED && !DOM_RENDERING)
    shManager.registerShaderType('linearGradient', defaultShaderLinearGradient);
}

export function registerDefaultShaders(shManager: CoreShaderManager) {
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
