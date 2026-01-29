import type { WebGlShaderType } from '@lightningjs/renderer/webgl';
import { calcFactoredRadiusArray, type Vec4 } from './utils.js';
import {
  RoundedTemplate,
  type RoundedProps,
} from './templates/RoundedTemplate.js';

interface CoreNode {
  w: number;
  h: number;
}

/**
 * Similar to the {@link DefaultShader} but cuts out 4 rounded rectangle corners
 * as defined by the specified corner {@link RoundedProps.radius}
 */
export const Rounded: WebGlShaderType<RoundedProps> = {
  props: RoundedTemplate.props,
  update(node: CoreNode) {
    this.uniform4fa(
      'u_radius',
      calcFactoredRadiusArray(this.props!.radius as Vec4, node.w, node.h),
    );
  },
  vertex: `
  # ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  # else
  precision mediump float;
  # endif

  attribute vec2 a_position;
  attribute vec2 a_textureCoords;
  attribute vec4 a_color;
  attribute vec2 a_nodeCoords;

  uniform vec2 u_resolution;
  uniform float u_pixelRatio;

  varying vec4 v_color;
  varying vec2 v_textureCoords;
  varying vec2 v_nodeCoords;

  void main() {
    vec2 normalized = a_position * u_pixelRatio;
    vec2 screenSpace = vec2(2.0 / u_resolution.x, -2.0 / u_resolution.y);

    v_color = a_color;
    v_nodeCoords = a_nodeCoords;
    v_textureCoords = a_textureCoords;

    gl_Position = vec4(
      normalized.x * screenSpace.x - 1.0,
      normalized.y * -abs(screenSpace.y) + 1.0,
      0.0,
      1.0
    );
  }
`,
  fragment: `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    uniform vec2 u_dimensions;
    uniform float u_alpha;
    uniform float u_pixelRatio;
    uniform sampler2D u_texture;
    uniform vec4 u_radius;

    varying vec4 v_color;
    varying vec2 v_textureCoords;
    varying vec2 v_nodeCoords;

    void main() {
      vec2 halfDimensions = u_dimensions * 0.5;
      vec2 boxUv = v_nodeCoords * u_dimensions - halfDimensions;

      // Branchless radius selection based on quadrant
      // x: TL, y: TR, z: BR, w: BL
      vec2 stepVal = step(vec2(0.0), boxUv);
      float r = mix(
        mix(u_radius.x, u_radius.y, stepVal.x),
        mix(u_radius.w, u_radius.z, stepVal.x),
        stepVal.y
      );

      vec2 q = abs(boxUv) - halfDimensions + r;
      float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;

      float edgeWidth = 1.0 / u_pixelRatio;
      float alpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, d);

      vec4 color = texture2D(u_texture, v_textureCoords) * v_color;
      gl_FragColor = color * alpha * u_alpha;
    }
  `,
};
