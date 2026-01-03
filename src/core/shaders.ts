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

export const defaultShaderRoundedWithBorder: ShaderRoundedWithBorder = {
  props: roundedWithBorderProps,
  canBatch: () => false,
  update(node) {
    let props = this.props!;
    let borderWidth = props['border-w'] as Vec4;
    let borderGap = props['border-gap'];
    let inset = props['border-inset'];

    let [b_t, b_r, b_b, b_l] = borderWidth;

    this.uniformRGBA('u_borderColor', props['border-color']);
    this.uniform4fa('u_border', borderWidth);
    this.uniform1f('u_gap', borderGap);
    this.uniform1i('u_inset', inset ? 1 : 0);

    // Check if border is zero (no border widths)
    let borderZero = b_t === 0 && b_r === 0 && b_b === 0 && b_l === 0;
    this.uniform1i('u_borderZero', borderZero ? 1 : 0);

    let origWidth = node.w;
    let origHeight = node.h;
    this.uniform2f('u_dimensions_orig', origWidth, origHeight);

    let finalWidth = origWidth;
    let finalHeight = origHeight;
    if (!inset) {
      // For outside borders, expand dimensions
      finalWidth = origWidth + b_l + b_r + borderGap * 2;
      finalHeight = origHeight + b_t + b_b + borderGap * 2;
    }

    // u_dimensions for the shader's SDF functions
    this.uniform2f('u_dimensions', finalWidth, finalHeight);

    // The `radius` property is for the content rectangle.
    // Factor it against the appropriate dimensions to prevent self-intersection.
    let contentRadius = calcFactoredRadiusArray(
      props.radius as Vec4,
      origWidth,
      origHeight,
    );

    // Calculate the appropriate radius for the shader based on inset mode
    let finalRadius = contentRadius;
    if (!inset) {
      // For each corner, the total radius is content radius + gap + border thickness.
      // Border thickness at a corner is approximated as the max of the two adjacent border sides.
      let outerRadius: Vec4 = [
        contentRadius[0] + borderGap + Math.max(b_t, b_l), // top-left
        contentRadius[1] + borderGap + Math.max(b_t, b_r), // top-right
        contentRadius[2] + borderGap + Math.max(b_b, b_r), // bottom-right
        contentRadius[3] + borderGap + Math.max(b_b, b_l), // bottom-left
      ];
      calcFactoredRadiusArray(
        outerRadius,
        finalWidth,
        finalHeight,
        finalRadius,
      );
    }

    this.uniform4fa('u_radius', finalRadius);
  },
  vertex: /*glsl*/ `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    /* Passed by lightning renderer */
    attribute vec2 a_position;
    attribute vec2 a_textureCoords;
    attribute vec4 a_color;
    attribute vec2 a_nodeCoords;

    uniform vec2 u_resolution;
    uniform float u_pixelRatio;

    /* Passed by shader setup */
    uniform vec2 u_dimensions;
    uniform vec2 u_dimensions_orig;
    uniform vec4 u_radius;
    uniform vec4 u_border;
    uniform float u_gap;
    uniform bool u_inset;
    uniform bool u_borderZero;

    varying vec4 v_color;
    varying vec2 v_texcoords;
    varying vec2 v_nodeCoords;
    varying vec4 v_borderEndRadius;
    varying vec2 v_borderEndSize;

    varying vec4 v_innerRadius;
    varying vec2 v_innerSize;
    varying vec2 v_halfDimensions;

    void main() {
      vec2 screen_space = vec2(2.0 / u_resolution.x, -2.0 / u_resolution.y);

      v_color = a_color;
      v_nodeCoords = a_nodeCoords;

      float b_t = u_border.x;
      float b_r = u_border.y;
      float b_b = u_border.z;
      float b_l = u_border.w;

      // Calculate the offset to expand/contract the quad for border and gap
      vec2 expansion_offset = vec2(0.0);
      if (!u_inset) {
        // Outside border: expand the quad
        if (a_nodeCoords.x == 0.0) { // Left edge vertex
          expansion_offset.x = -(b_l + u_gap);
        } else { // Right edge vertex (a_nodeCoords.x == 1.0)
          expansion_offset.x =  (b_r + u_gap);
        }
        if (a_nodeCoords.y == 0.0) { // Top edge vertex
          expansion_offset.y = -(b_t + u_gap);
        } else { // Bottom edge vertex (a_nodeCoords.y == 1.0)
          expansion_offset.y =  (b_b + u_gap);
        }
      }
      // For inset borders, no expansion needed - use original position

      // Texture coordinate calculation
      v_texcoords = a_textureCoords;
      if (!u_inset) { // For outside borders, adjust texture coordinates for expansion
        v_texcoords *= u_dimensions;
        v_texcoords.x -= b_l + u_gap;
        v_texcoords.y -= b_t + u_gap;
        v_texcoords /= u_dimensions_orig;
      }

      v_halfDimensions = u_dimensions * 0.5;
      if (!u_borderZero) {

        float gap_x2 = u_gap * 2.0;

        if (u_inset) {
          // For inset borders, flip the meaning:
          // v_borderEndRadius/Size represents the gap area
          // v_innerRadius/Size represents the border area

          // Gap area (v_borderEnd represents gap boundary) - uniform gap
          v_borderEndRadius = u_radius - u_gap - 0.5;
          v_borderEndSize = (u_dimensions - gap_x2 - 1.0) * 0.5;

          // Border area (v_inner represents border boundary) - individual border widths
          v_innerRadius.x = u_radius.x - u_gap - max(b_t, b_l) - 0.5;
          v_innerRadius.y = u_radius.y - u_gap - max(b_t, b_r) - 0.5;
          v_innerRadius.z = u_radius.z - u_gap - max(b_b, b_r) - 0.5;
          v_innerRadius.w = u_radius.w - u_gap - max(b_b, b_l) - 0.5;

          v_innerSize = (u_dimensions - gap_x2 - vec2(b_l + b_r, b_t + b_b) - 1.0) * 0.5;
        } else {
          // For outside borders, calculate from expanded dimensions inward
          v_borderEndRadius.x = u_radius.x - max(b_t, b_l) - 0.5;
          v_borderEndRadius.y = u_radius.y - max(b_t, b_r) - 0.5;
          v_borderEndRadius.z = u_radius.z - max(b_b, b_r) - 0.5;
          v_borderEndRadius.w = u_radius.w - max(b_b, b_l) - 0.5;

          v_borderEndSize = (u_dimensions - vec2(b_l + b_r, b_t + b_b) - 1.0) * 0.5;

          v_innerRadius.x = u_radius.x - max(b_t, b_l) - u_gap - 0.5;
          v_innerRadius.y = u_radius.y - max(b_t, b_r) - u_gap - 0.5;
          v_innerRadius.z = u_radius.z - max(b_b, b_r) - u_gap - 0.5;
          v_innerRadius.w = u_radius.w - max(b_b, b_l) - u_gap - 0.5;

          v_innerSize.x = u_dimensions.x - (b_l + b_r) - gap_x2 - 1.0;
          v_innerSize.y = u_dimensions.y - (b_t + b_b) - gap_x2 - 1.0;
          v_innerSize *= 0.5;
        }

        v_borderEndRadius = max(v_borderEndRadius, vec4(0.0));
        v_innerRadius     = max(v_innerRadius, vec4(0.0));
      }

      vec2 normalized = (a_position + expansion_offset) * u_pixelRatio;

      gl_Position = vec4(normalized.x * screen_space.x - 1.0, normalized.y * -abs(screen_space.y) + 1.0, 0.0, 1.0);
      gl_Position.y = -sign(screen_space.y) * gl_Position.y;
    }
  `,
  fragment: /*glsl*/ `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    /* Passed by lightning renderer */
    uniform vec2 u_resolution;
    uniform float u_pixelRatio;
    uniform float u_alpha;
    uniform vec2 u_dimensions;
    uniform sampler2D u_texture;

    /* Passed by shader setup */
    uniform vec4 u_radius;

    uniform vec4 u_border;
    uniform vec4 u_borderColor;
    uniform bool u_inset;
    uniform bool u_borderZero;

    varying vec4 v_borderEndRadius;
    varying vec2 v_borderEndSize;

    varying vec4 v_color;
    varying vec2 v_texcoords;
    varying vec2 v_nodeCoords;

    varying vec2 v_halfDimensions;
    varying vec4 v_innerRadius;
    varying vec2 v_innerSize;

    float roundedBox(vec2 p, vec2 s, vec4 r) {
      r.xy = (p.x > 0.0) ? r.yz : r.xw;
      r.x = (p.y > 0.0) ? r.y : r.x;
      vec2 q = abs(p) - s + r.x;
      return (min(max(q.x, q.y), 0.0) + length(max(q, 0.0))) - r.x;
    }

    void main() {
      vec4 contentTexColor = texture2D(u_texture, v_texcoords) * v_color;

      vec2 boxUv = v_nodeCoords.xy * u_dimensions - v_halfDimensions;
      float outerShapeDist = roundedBox(boxUv, v_halfDimensions, u_radius);
      float outerShapeAlpha = 1.0 - smoothstep(0.0, 1.0, outerShapeDist); // 1 inside, 0 outside

      if (u_borderZero) { // No border, effectively no gap from border logic
        gl_FragColor = mix(vec4(0.0), contentTexColor, outerShapeAlpha) * u_alpha;
        return;
      }

      // Adjust boxUv for non-uniform borders
      // This adjusted UV is used for calculating distances to border-end and content shapes
      vec2 adjustedBoxUv = boxUv;
      vec2 borderAdjustedBoxUv = boxUv;

      if (!u_inset) {
        // For outside borders, use same adjustment for both calculations
        adjustedBoxUv.x += (u_border.y - u_border.w) * 0.5;
        adjustedBoxUv.y += (u_border.z - u_border.x) * 0.5;
        borderAdjustedBoxUv = adjustedBoxUv;
      } else {
        // For inset borders, gap calculation uses no adjustment (uniform gap)
        // Border calculation uses adjustment (non-uniform border)
        borderAdjustedBoxUv.x += (u_border.y - u_border.w) * 0.5;
        borderAdjustedBoxUv.y += (u_border.z - u_border.x) * 0.5;
      }

      // Distance to the inner edge of the border (where the gap begins)
      float borderEndDist = roundedBox(adjustedBoxUv, v_borderEndSize, v_borderEndRadius);
      float borderEndAlpha = 1.0 - smoothstep(0.0, 1.0, borderEndDist); // 1 if inside gap or content, 0 if in border or outside

      // Distance to the content area (after the gap)
      float contentDist = roundedBox(borderAdjustedBoxUv, v_innerSize, v_innerRadius);
      float contentAlpha = 1.0 - smoothstep(0.0, 1.0, contentDist); // 1 if inside content, 0 if in gap, border or outside

      vec4 finalColor;
      if (u_inset) { // For inset borders: border <- gap <- element
        // flip the logic: borderEndAlpha becomes gap, contentAlpha becomes border+content
        if (contentAlpha > 0.0) { // Pixel is inside the content area (innermost)
          finalColor = contentTexColor;
        } else if (borderEndAlpha > 0.0) { // Pixel is inside the border area (middle)
          vec4 borderColor = u_borderColor;
          finalColor = mix(contentTexColor, vec4(borderColor.rgb, 1.0), borderColor.a);
        } else { // Pixel is in the gap area (outermost) - show content through gap
          finalColor = contentTexColor;
        }
      } else { // For outside borders: element -> gap -> border
        if (contentAlpha > 0.0) { // Pixel is inside the content area
          finalColor = contentTexColor;
        } else if (borderEndAlpha > 0.0) { // Pixel is inside the gap area
          finalColor = vec4(0.0); // Transparent gap
        } else { // Pixel is inside the border area
          vec4 borderColor = u_borderColor;
          finalColor = borderColor;
          finalColor.rgb *= finalColor.a;
        }
      }

      gl_FragColor = mix(vec4(0.0), finalColor, outerShapeAlpha) * u_alpha;
    }
  `,
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
