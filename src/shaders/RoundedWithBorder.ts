import { calcFactoredRadiusArray, type Vec4 } from './utils.js';
import type { WebGlShaderType } from '@lightningjs/renderer/webgl';
import {
  RoundedWithBorderTemplate,
  type RoundedWithBorderProps,
} from './templates/RoundedWithBorderTemplate.js';

interface CoreNode {
  w: number;
  h: number;
}

export const RoundedWithBorder: WebGlShaderType<RoundedWithBorderProps> = {
  props: RoundedWithBorderTemplate.props,
  update(node: CoreNode) {
    const props = this.props!;
    const borderWidth = props['border-w'] as Vec4;
    const borderGap = props['border-gap'] || 0;

    this.uniformRGBA('u_borderColor', props['border-color']);
    this.uniform4fa('u_borderWidth', borderWidth);
    this.uniform1f('u_borderGap', borderGap);
    this.uniformRGBA('u_borderGapColor', props['border-gapColor']);

    const origWidth = node.w;
    const origHeight = node.h;
    this.uniform2f('u_dimensions_orig', origWidth, origHeight);

    const expandedWidth =
      origWidth + borderWidth[3] + borderWidth[1] + borderGap * 2; // original + left + right + 2*gap
    const expandedHeight =
      origHeight + borderWidth[0] + borderWidth[2] + borderGap * 2; // original + top + bottom + 2*gap

    // u_dimensions for the shader's SDF functions should be the expanded size
    this.uniform2f('u_dimensions', expandedWidth, expandedHeight);

    // The `radius` property is for the content rectangle.
    // Factor it against the original dimensions to prevent self-intersection.
    const contentRadius = calcFactoredRadiusArray(
      this.props!.radius as Vec4,
      origWidth,
      origHeight,
    );

    // From the content radius, calculate the outer radius of the border.
    // For each corner, the total radius is content radius + gap + border thickness.
    // Border thickness at a corner is approximated as the max of the two adjacent border sides.
    const bTop = borderWidth[0],
      bRight = borderWidth[1],
      bBottom = borderWidth[2],
      bLeft = borderWidth[3];
    const outerRadius: Vec4 = [
      Math.max(0, contentRadius[0] + borderGap + Math.max(bTop, bLeft)), // top-left
      Math.max(0, contentRadius[1] + borderGap + Math.max(bTop, bRight)), // top-right
      Math.max(0, contentRadius[2] + borderGap + Math.max(bBottom, bRight)), // bottom-right
      Math.max(0, contentRadius[3] + borderGap + Math.max(bBottom, bLeft)), // bottom-left
    ];

    // The final radius passed to the shader is the outer radius of the whole shape.
    // It also needs to be factored against the expanded dimensions.
    // The shader will then work inwards to calculate the radii for the gap and content.
    this.uniform4fa(
      'u_radius',
      calcFactoredRadiusArray(outerRadius, expandedWidth, expandedHeight),
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
    uniform vec2 u_dimensions;
    uniform vec2 u_dimensions_orig;

    uniform vec4 u_radius;
    uniform vec4 u_borderWidth;
    uniform float u_borderGap;

    varying vec4 v_color;
    varying vec2 v_textureCoords;
    varying vec2 v_nodeCoords;
    varying vec4 v_borderEndRadius;
    varying vec2 v_borderEndSize;

    varying vec4 v_innerRadius;
    varying vec2 v_innerSize;
    varying vec2 v_halfDimensions;
    varying float v_borderZero;

    void main() {
      vec2 screenSpace = vec2(2.0 / u_resolution.x, -2.0 / u_resolution.y);

      v_color = a_color;
      v_nodeCoords = a_nodeCoords;

      float bTop = u_borderWidth.x;
      float bRight = u_borderWidth.y;
      float bBottom = u_borderWidth.z;
      float bLeft = u_borderWidth.w;
      float gap = u_borderGap;

      // Calculate the offset to expand the quad for border and gap
      vec2 expansionOffset = vec2(0.0);
      if (a_nodeCoords.x == 0.0) { // Left edge vertex
          expansionOffset.x = -(bLeft + gap);
      } else { // Right edge vertex (a_nodeCoords.x == 1.0)
          expansionOffset.x = (bRight + gap);
      }
      if (a_nodeCoords.y == 0.0) { // Top edge vertex
          expansionOffset.y = -(bTop + gap);
      } else { // Bottom edge vertex (a_nodeCoords.y == 1.0)
          expansionOffset.y = (bBottom + gap);
      }

      vec2 expanded_a_position = a_position + expansionOffset;
      vec2 normalized = expanded_a_position * u_pixelRatio;

      // u_dimensions is expanded, u_dimensions_orig is original content size
      v_textureCoords.x = (a_textureCoords.x * u_dimensions.x - (bLeft + gap)) / u_dimensions_orig.x;
      v_textureCoords.y = (a_textureCoords.y * u_dimensions.y - (bTop + gap)) / u_dimensions_orig.y;

      v_borderZero = (u_borderWidth.x == 0.0 && u_borderWidth.y == 0.0 && u_borderWidth.z == 0.0 && u_borderWidth.w == 0.0) ? 1.0 : 0.0;
      // If there's no border, there's no gap from the border logic perspective
      // The Rounded shader itself would handle radius if borderZero is true.
      v_halfDimensions = u_dimensions * 0.5; // u_dimensions is now expanded_dimensions
      if(v_borderZero == 0.0) {
        // Calculate radius and size for the inner edge of the border (where the gap begins)
        v_borderEndRadius = vec4(
          max(0.0, u_radius.x - max(bTop, bLeft) - 0.5),
          max(0.0, u_radius.y - max(bTop, bRight) - 0.5),
          max(0.0, u_radius.z - max(bBottom, bRight) - 0.5),
          max(0.0, u_radius.w - max(bBottom, bLeft) - 0.5)
        );
        v_borderEndSize = vec2(
            (u_dimensions.x - (bLeft + bRight) - 1.0),
            (u_dimensions.y - (bTop + bBottom) - 1.0)
        ) * 0.5;

        // Calculate radius and size for the content area (after the gap)
        v_innerRadius = vec4(
          max(0.0, u_radius.x - max(bTop, bLeft) - u_borderGap - 0.5),
          max(0.0, u_radius.y - max(bTop, bRight) - u_borderGap - 0.5),
          max(0.0, u_radius.z - max(bBottom, bRight) - u_borderGap - 0.5),
          max(0.0, u_radius.w - max(bBottom, bLeft) - u_borderGap - 0.5)
        );
        v_innerSize = vec2(
            (u_dimensions.x - (bLeft + bRight) - (u_borderGap * 2.0) - 1.0),
            (u_dimensions.y - (bTop + bBottom) - (u_borderGap * 2.0) - 1.0)
        ) * 0.5;
      }

      gl_Position = vec4(normalized.x * screenSpace.x - 1.0, normalized.y * -abs(screenSpace.y) + 1.0, 0.0, 1.0);
      gl_Position.y = -sign(screenSpace.y) * gl_Position.y;
    }
  `,
  fragment: `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    uniform vec2 u_resolution;
    uniform float u_pixelRatio;
    uniform float u_alpha;
    uniform vec2 u_dimensions;
    uniform sampler2D u_texture;

    uniform vec4 u_radius;

    uniform vec4 u_borderWidth;
    uniform vec4 u_borderColor;
    uniform vec4 u_borderGapColor;

    varying vec4 v_borderEndRadius;
    varying vec2 v_borderEndSize;

    varying vec4 v_color;
    varying vec2 v_textureCoords;
    varying vec2 v_nodeCoords;

    varying vec2 v_halfDimensions;
    varying vec4 v_innerRadius;
    varying vec2 v_innerSize;
    varying float v_borderZero;

    float roundedBox(vec2 p, vec2 s, vec4 r) {
      r.xy = (p.x > 0.0) ? r.yz : r.xw;
      r.x = (p.y > 0.0) ? r.y : r.x;
      vec2 q = abs(p) - s + r.x;
      return (min(max(q.x, q.y), 0.0) + length(max(q, 0.0))) - r.x;
    }

    void main() {
      vec4 contentTexColor = texture2D(u_texture, v_textureCoords) * v_color;

      vec2 boxUv = v_nodeCoords.xy * u_dimensions - v_halfDimensions;
      float outerShapeDist = roundedBox(boxUv, v_halfDimensions, u_radius);

      float edgeWidth = 1.0 / u_pixelRatio;
      float outerShapeAlpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, outerShapeDist);

      if(v_borderZero == 1.0) { // No border, effectively no gap from border logic
        gl_FragColor = mix(vec4(0.0), contentTexColor, outerShapeAlpha) * u_alpha;
        return;
      }

      // Adjust boxUv for non-uniform borders
      vec2 adjustedBoxUv = boxUv;
      adjustedBoxUv.x += (u_borderWidth.y - u_borderWidth.w) * 0.5;
      adjustedBoxUv.y += (u_borderWidth.z - u_borderWidth.x) * 0.5;

      // Inner Border Edge (Gap starts here)
      float borderEndDist = roundedBox(adjustedBoxUv, v_borderEndSize, v_borderEndRadius);
      float borderEndAlpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, borderEndDist);

      // Content Area (Gap ends here)
      float contentDist = roundedBox(adjustedBoxUv, v_innerSize, v_innerRadius);
      float contentAlpha = 1.0 - smoothstep(-0.5 * edgeWidth, 0.5 * edgeWidth, contentDist);

      // Calculate Masks for mutually exclusive regions based on priority (Border Top, Gap Middle, Content Bottom)
      float borderMask = clamp(outerShapeAlpha - borderEndAlpha, 0.0, 1.0);
      float gapMask = clamp(borderEndAlpha - contentAlpha, 0.0, 1.0);

      // Composite Layers
      // 1. Content
      vec4 composite = mix(vec4(0.0), contentTexColor, contentAlpha);
      // 2. Gap
      composite = mix(composite, u_borderGapColor, gapMask);
      // 3. Border
      composite = mix(composite, u_borderColor, borderMask);

      gl_FragColor = composite * u_alpha;
    }
  `,
};
