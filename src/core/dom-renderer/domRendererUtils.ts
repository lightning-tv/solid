// Utilities extracted from domRenderer.ts for clarity
import * as lng from '@lightningjs/renderer';
import { Config } from '../config.js';
import { DOMNode } from './domRenderer.js';
import { isFunc } from '../utils.js';

// #region Color & Gradient Utils

export const colorToRgba = (c: number) =>
  `rgba(${(c >> 24) & 0xff},${(c >> 16) & 0xff},${(c >> 8) & 0xff},${(c & 0xff) / 255})`;

export function buildGradientStops(colors: number[], stops?: number[]): string {
  if (!Array.isArray(colors) || colors.length === 0) return '';
  const positions: number[] = [];
  if (Array.isArray(stops) && stops.length === colors.length) {
    for (let v of stops) {
      if (typeof v !== 'number' || !isFinite(v)) {
        positions.push(0);
        continue;
      }
      let pct = v <= 1 ? v * 100 : v;
      if (pct < 0) pct = 0;
      if (pct > 100) pct = 100;
      positions.push(pct);
    }
  } else {
    const lastIndex = colors.length - 1;
    for (let i = 0; i < colors.length; i++) {
      positions.push(lastIndex === 0 ? 0 : (i / lastIndex) * 100);
    }
  }
  if (positions.length !== colors.length) {
    while (positions.length < colors.length)
      positions.push(positions.length === 0 ? 0 : 100);
  }
  return colors
    .map((color, idx) => `${colorToRgba(color)} ${positions[idx]!.toFixed(2)}%`)
    .join(', ');
}

export function getNodeLineHeight(props: {
  lineHeight?: number;
  fontSize: number;
}): number {
  return (
    props.lineHeight || Config.fontSettings.lineHeight || 1.2 * props.fontSize
  );
}

/** Legacy object-fit fall back for unsupported browsers */
export function computeLegacyObjectFit(
  node: DOMNode,
  img: HTMLImageElement,
  resizeMode: ({ type?: string } & Record<string, any>) | undefined,
  clipX: number,
  clipY: number,
  srcPos: null | { x: number; y: number },
  supportsObjectFit: boolean,
  supportsObjectPosition: boolean,
) {
  if (supportsObjectFit && supportsObjectPosition) return;
  const containerW = node.props.w || img.naturalWidth;
  const containerH = node.props.h || img.naturalHeight;
  const naturalW = img.naturalWidth || 1;
  const naturalH = img.naturalHeight || 1;
  let fitType = resizeMode?.type || (srcPos ? 'none' : 'fill');
  let drawW = naturalW;
  let drawH = naturalH;
  switch (fitType) {
    case 'cover': {
      const scale = Math.max(containerW / naturalW, containerH / naturalH);
      drawW = naturalW * scale;
      drawH = naturalH * scale;
      break;
    }
    case 'contain': {
      const scale = Math.min(containerW / naturalW, containerH / naturalH);
      drawW = naturalW * scale;
      drawH = naturalH * scale;
      break;
    }
    case 'fill': {
      drawW = containerW;
      drawH = containerH;
      break;
    }
  }
  let offsetX = (containerW - drawW) * clipX;
  let offsetY = (containerH - drawH) * clipY;
  if (srcPos) {
    offsetX = -srcPos.x;
    offsetY = -srcPos.y;
  }
  const styleParts = [
    'position: absolute',
    `width: ${Math.round(drawW)}px`,
    `height: ${Math.round(drawH)}px`,
    `left: ${Math.round(offsetX)}px`,
    `top: ${Math.round(offsetY)}px`,
    'display: block',
    'pointer-events: none',
  ];
  img.style.removeProperty('object-fit');
  img.style.removeProperty('object-position');
  if (resizeMode?.type === 'none') {
    styleParts[1] = `width: ${naturalW}px`;
    styleParts[2] = `height: ${naturalH}px`;
  }
  img.setAttribute('style', styleParts.join('; ') + ';');
}

export function applySubTextureScaling(
  node: DOMNode,
  img: HTMLImageElement,
  srcPos: InstanceType<lng.TextureMap['SubTexture']>['props'] | null,
) {
  if (!srcPos) return;
  const regionW = node.props.srcWidth ?? srcPos.w;
  const regionH = node.props.srcHeight ?? srcPos.h;
  if (!regionW || !regionH) return;
  const targetW = node.props.w || regionW;
  const targetH = node.props.h || regionH;
  if (targetW === regionW && targetH === regionH) return;
  const naturalW = img.naturalWidth || regionW;
  const naturalH = img.naturalHeight || regionH;
  const scaleX = targetW / regionW;
  const scaleY = targetH / regionH;
  img.style.width = naturalW + 'px';
  img.style.height = naturalH + 'px';
  img.style.objectFit = 'none';
  img.style.objectPosition = '0 0';
  img.style.transformOrigin = '0 0';
  const translateX = Math.round(-srcPos.x * scaleX);
  const translateY = Math.round(-srcPos.y * scaleY);
  img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
  img.style.setProperty('-webkit-transform', img.style.transform);
  if (node.divBg) {
    const styleEl = node.divBg.style;
    if (
      styleEl.maskImage ||
      styleEl.webkitMaskImage ||
      /mask-image:/.test(node.divBg.getAttribute('style') || '')
    ) {
      img.style.display = 'none';
      const maskW = Math.round(naturalW * scaleX);
      const maskH = Math.round(naturalH * scaleY);
      const maskPosX = translateX;
      const maskPosY = translateY;
      styleEl.setProperty?.('mask-size', `${maskW}px ${maskH}px`);
      styleEl.setProperty?.('mask-position', `${maskPosX}px ${maskPosY}px`);
      styleEl.setProperty?.('-webkit-mask-size', `${maskW}px ${maskH}px`);
      styleEl.setProperty?.(
        '-webkit-mask-position',
        `${maskPosX}px ${maskPosY}px`,
      );
    }
  }
}
export function applyEasing(
  easing: string | lng.TimingFunction,
  progress: number,
): number {
  if (isFunc(easing)) {
    return easing(progress);
  }

  switch (easing) {
    case 'linear':
    default:
      return progress;
    case 'ease-in':
      return progress * progress;
    case 'ease-out':
      return progress * (2 - progress);
    case 'ease-in-out':
      return progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;
  }
}
function interpolate(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function interpolateColor(start: number, end: number, t: number): number {
  return (
    ((interpolate((start >> 24) & 0xff, (end >> 24) & 0xff, t) << 24) |
      (interpolate((start >> 16) & 0xff, (end >> 16) & 0xff, t) << 16) |
      (interpolate((start >> 8) & 0xff, (end >> 8) & 0xff, t) << 8) |
      interpolate(start & 0xff, end & 0xff, t)) >>>
    0
  );
}

export function interpolateProp(
  name: string,
  start: number,
  end: number,
  t: number,
): number {
  return name.startsWith('color')
    ? interpolateColor(start, end, t)
    : interpolate(start, end, t);
}

export function compactString(input: string): string {
  return input.replace(/\s*\n\s*/g, ' ');
}

// #region Renderer State Utils

export function isRenderStateInBounds(state: lng.CoreNodeRenderState): boolean {
  return state === 4 || state === 8;
}

export function nodeHasTextureSource(node: DOMNode): boolean {
  const textureType = node.props.texture?.type;
  return (
    !!node.props.src ||
    textureType === lng.TextureType.image ||
    textureType === lng.TextureType.subTexture
  );
}

export function normalizeBoundsMargin(
  margin: number | [number, number, number, number] | null | undefined,
): [number, number, number, number] {
  if (margin == null) return [0, 0, 0, 0];
  if (typeof margin === 'number') {
    return [margin, margin, margin, margin];
  }
  if (Array.isArray(margin) && margin.length === 4) {
    return [margin[0] ?? 0, margin[1] ?? 0, margin[2] ?? 0, margin[3] ?? 0];
  }
  return [0, 0, 0, 0];
}

export function computeRenderStateForNode(
  node: DOMNode,
): lng.CoreNodeRenderState | null {
  const stageRoot = node.stage.root as DOMNode | undefined;
  if (!stageRoot || stageRoot === node) return null;

  const rootWidth = stageRoot.props.w ?? 0;
  const rootHeight = stageRoot.props.h ?? 0;
  if (rootWidth <= 0 || rootHeight <= 0) return 4;

  const rootLeft = stageRoot.absX;
  const rootTop = stageRoot.absY;
  const rootRight = rootLeft + rootWidth;
  const rootBottom = rootTop + rootHeight;

  const [marginTop, marginRight, marginBottom, marginLeft] =
    normalizeBoundsMargin(
      node.props.boundsMargin ?? node.stage.renderer.boundsMargin,
    );

  const width = node.props.w ?? 0;
  const height = node.props.h ?? 0;

  const left = node.absX;
  const top = node.absY;
  const right = left + width;
  const bottom = top + height;

  const expandedLeft = rootLeft - marginLeft;
  const expandedTop = rootTop - marginTop;
  const expandedRight = rootRight + marginRight;
  const expandedBottom = rootBottom + marginBottom;

  const intersectsBounds =
    right >= expandedLeft &&
    left <= expandedRight &&
    bottom >= expandedTop &&
    top <= expandedBottom;

  if (!intersectsBounds) {
    return 2;
  }

  const intersectsViewport =
    right >= rootLeft &&
    left <= rootRight &&
    bottom >= rootTop &&
    top <= rootBottom;

  if (intersectsViewport) {
    return 8;
  }

  return 4;
}
