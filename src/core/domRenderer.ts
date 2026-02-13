/*

Experimental DOM renderer

*/

import * as lng from '@lightningjs/renderer';
import { EventEmitter } from '@lightningjs/renderer/utils';

import { Config } from './config.js';
import {
  IRendererShader,
  IRendererStage,
  IRendererShaderProps,
  IRendererTextureProps,
  IRendererTexture,
  IRendererMain,
  IRendererNode,
  IRendererNodeProps,
  IRendererTextNode,
  IRendererTextNodeProps,
} from './lightningInit.js';
import { isFunc } from './utils.js';

const colorToRgba = (c: number) =>
  `rgba(${(c >> 24) & 0xff},${(c >> 16) & 0xff},${(c >> 8) & 0xff},${(c & 0xff) / 255})`;

function applyEasing(
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
    (interpolate((start >> 24) & 0xff, (end >> 24) & 0xff, t) << 24) |
    (interpolate((start >> 16) & 0xff, (end >> 16) & 0xff, t) << 16) |
    (interpolate((start >> 8) & 0xff, (end >> 8) & 0xff, t) << 8) |
    interpolate(start & 0xff, end & 0xff, t)
  );
}

function interpolateProp(
  name: string,
  start: number,
  end: number,
  t: number,
): number {
  return name.startsWith('color')
    ? interpolateColor(start, end, t)
    : interpolate(start, end, t);
}

/*
 Animations
*/

let animationTasks: AnimationController[] = [];
let animationFrameRequested = false;

function requestAnimationUpdate() {
  if (!animationFrameRequested && animationTasks.length > 0) {
    animationFrameRequested = true;
    requestAnimationFrame(updateAnimations);
  }
}

function updateAnimations(time: number) {
  animationFrameRequested = false;

  /*
   tasks are iterated in insertion order
   so that the later task will override the earlier ones
  */
  for (let i = 0; i < animationTasks.length; i++) {
    let task = animationTasks[i]!;
    if (task.pausedTime != null) continue;

    let elapsed = time - task.timeStart;

    // Still in delay period
    if (elapsed < task.settings.delay) {
      requestAnimationUpdate();
      continue;
    }

    let activeTime = elapsed - task.settings.delay;

    if (activeTime >= task.settings.duration) {
      // Start next iteration
      if (task.settings.loop || task.iteration < task.settings.repeat - 1) {
        task.iteration++;
        task.timeStart = time - task.settings.delay;
        requestAnimationUpdate();
      }
      // Animation complete
      else {
        Object.assign(task.node.props, task.propsEnd);
        updateNodeStyles(task.node);

        task.stop();
        i--;
      }
      continue;
    }

    /*
     Update props and styles
    */
    let t = activeTime / task.settings.duration;
    t = applyEasing(task.settings.easing, t);

    for (let prop in task.propsEnd) {
      let start = task.propsStart[prop]!;
      let end = task.propsEnd[prop]!;
      (task.node.props as any)[prop] = interpolateProp(prop, start, end, t);
    }

    updateNodeStyles(task.node);
  }

  requestAnimationUpdate();
}

class AnimationController implements lng.IAnimationController {
  state: lng.AnimationControllerState = 'paused';

  stopPromise: Promise<void> | null = null;
  stopResolve: (() => void) | null = null;

  propsStart: Record<string, number> = {};
  propsEnd: Record<string, number> = {};
  timeStart: number = performance.now();
  timeEnd: number;
  settings: Required<lng.AnimationSettings>;
  iteration: number = 0;
  pausedTime: number | null = null;

  constructor(
    public node: DOMNode,
    props: Partial<lng.INodeAnimateProps<any>>,
    rawSettings: Partial<lng.AnimationSettings>,
  ) {
    this.settings = {
      duration: rawSettings.duration ?? 300,
      delay: rawSettings.delay ?? 0,
      easing: rawSettings.easing ?? 'linear',
      loop: rawSettings.loop ?? false,
      repeat: rawSettings.repeat ?? 1,
      stopMethod: false,
    };

    this.timeEnd =
      this.timeStart + this.settings.delay + this.settings.duration;

    for (let [prop, value] of Object.entries(props)) {
      if (value != null && typeof value === 'number') {
        this.propsStart[prop] = (node.props as any)[prop];
        this.propsEnd[prop] = value;
      }
    }

    animationTasks.push(this);
  }

  start() {
    if (this.pausedTime != null) {
      this.timeStart += performance.now() - this.pausedTime;
      this.pausedTime = null;
    } else {
      this.timeStart = performance.now();
    }
    this.state = 'running';
    requestAnimationUpdate();
    return this;
  }
  pause() {
    this.pausedTime = performance.now();
    this.state = 'paused';
    return this;
  }
  stop() {
    let index = animationTasks.indexOf(this);
    if (index !== -1) {
      animationTasks.splice(index, 1);
    }
    this.state = 'stopped';
    if (this.stopResolve) {
      this.stopResolve();
      this.stopResolve = null;
      this.stopPromise = null;
    }
    return this;
  }
  restore() {
    return this;
  }
  waitUntilStopped() {
    this.stopPromise ??= new Promise((resolve) => {
      this.stopResolve = resolve;
    });
    return this.stopPromise;
  }
  on() {
    return this;
  }
  once() {
    return this;
  }
  off() {
    return this;
  }
  emit() {
    return this;
  }
}

function animate(
  this: DOMNode,
  props: Partial<lng.INodeAnimateProps<any>>,
  settings: Partial<lng.AnimationSettings>,
): lng.IAnimationController {
  return new AnimationController(this, props, settings);
}

/*
  Node Properties
*/

let elMap = new WeakMap<DOMNode, HTMLElement>();

function updateNodeParent(node: DOMNode | DOMText) {
  if (node.parent != null) {
    elMap.get(node.parent as DOMNode)!.appendChild(node.div);
  }
}

function getNodeLineHeight(props: IRendererTextNodeProps): number {
  return (
    props.lineHeight ?? Config.fontSettings.lineHeight ?? 1.2 * props.fontSize
  );
}

function updateNodeStyles(node: DOMNode | DOMText) {
  let { props } = node;

  let style = `position: absolute; z-index: ${props.zIndex};`;

  if (props.alpha !== 1) style += `opacity: ${props.alpha};`;

  if (props.clipping) {
    style += `overflow: hidden;`;
  }

  // Transform
  {
    let transform = '';

    let { x, y } = props;

    if (props.mountX != null) {
      x -= (props.w ?? 0) * props.mountX;
    }

    if (props.mountY != null) {
      y -= (props.h ?? 0) * props.mountY;
    }

    if (x !== 0) transform += `translateX(${x}px)`;

    if (y !== 0) transform += `translateY(${y}px)`;

    if (props.rotation !== 0) transform += `rotate(${props.rotation}rad)`;

    if (props.scale !== 1 && props.scale != null) {
      transform += `scale(${props.scale})`;
    } else {
      if (props.scaleX !== 1) transform += `scaleX(${props.scaleX})`;
      if (props.scaleY !== 1) transform += `scaleY(${props.scaleY})`;
    }

    if (transform.length > 0) {
      style += `transform: ${transform};`;
    }
  }

  // <Text>
  if (node instanceof DOMText) {
    let textProps = node.props;

    if (textProps.color != null && textProps.color !== 0) {
      style += `color: ${colorToRgba(textProps.color)};`;
    }
    if (textProps.fontFamily) {
      style += `font-family: ${textProps.fontFamily};`;
    }
    if (textProps.fontSize) {
      style += `font-size: ${textProps.fontSize}px;`;
    }
    if (textProps.fontStyle !== 'normal') {
      style += `font-style: ${textProps.fontStyle};`;
    }
    if (textProps.fontWeight !== 'normal') {
      style += `font-weight: ${textProps.fontWeight};`;
    }
    if (textProps.lineHeight != null) {
      style += `line-height: ${textProps.lineHeight}px;`;
    }
    if (textProps.letterSpacing) {
      style += `letter-spacing: ${textProps.letterSpacing}px;`;
    }
    if (textProps.textAlign !== 'left') {
      style += `text-align: ${textProps.textAlign};`;
    }

    let maxLines = textProps.maxLines || Infinity;
    switch (textProps.contain) {
      case 'width':
        style += `width: ${props.w}px; overflow: hidden;`;
        break;
      case 'both': {
        let lineHeight = getNodeLineHeight(textProps);
        maxLines = Math.min(maxLines, Math.floor(props.h / lineHeight));
        maxLines = Math.max(1, maxLines);
        let height = maxLines * lineHeight;
        style += `width: ${props.w}px; height: ${height}px; overflow: hidden;`;
        break;
      }
      case 'none':
        style += `width: max-content;`;
        break;
    }

    if (maxLines !== Infinity) {
      // https://stackoverflow.com/a/13924997
      style += `display: -webkit-box;
        overflow: hidden;
        -webkit-line-clamp: ${maxLines};
        line-clamp: ${maxLines};
        -webkit-box-orient: vertical;`;
    }

    // if (node.overflowSuffix) style += `overflow-suffix: ${node.overflowSuffix};`
    // if (node.verticalAlign) style += `vertical-align: ${node.verticalAlign};`

    scheduleUpdateDOMTextMeasurement(node);
  }
  // <Node>
  else {
    if (props.w !== 0) style += `width: ${props.w}px;`;
    if (props.h !== 0) style += `height: ${props.h}px;`;

    let vGradient =
      props.colorBottom !== props.colorTop
        ? `linear-gradient(to bottom, ${colorToRgba(props.colorTop)}, ${colorToRgba(props.colorBottom)})`
        : null;

    let hGradient =
      props.colorLeft !== props.colorRight
        ? `linear-gradient(to right, ${colorToRgba(props.colorLeft)}, ${colorToRgba(props.colorRight)})`
        : null;

    let gradient =
      vGradient && hGradient
        ? `${vGradient}, ${hGradient}`
        : vGradient || hGradient;

    let srcImg: string | null = null;
    let srcPos: null | { x: number; y: number } = null;

    if (
      props.texture != null &&
      props.texture.type === lng.TextureType.subTexture
    ) {
      srcPos = (props.texture as any).props;
      srcImg = `url(${(props.texture as any).props.texture.props.src})`;
    } else if (props.src) {
      srcImg = `url(${props.src})`;
    }

    let bgStyle = '';
    let borderStyle = '';
    let radiusStyle = '';
    let maskStyle = '';

    if (srcImg) {
      if (props.color !== 0xffffffff && props.color !== 0x00000000) {
        // use image as a mask
        bgStyle += `background-color: ${colorToRgba(props.color)}; background-blend-mode: multiply;`;
        maskStyle += `mask-image: ${srcImg};`;
        if (srcPos !== null) {
          maskStyle += `mask-position: -${srcPos.x}px -${srcPos.y}px;`;
        } else {
          maskStyle += `mask-size: 100% 100%;`;
        }
      } else if (gradient) {
        // use gradient as a mask
        maskStyle += `mask-image: ${gradient};`;
      }

      bgStyle += `background-image: ${srcImg};`;
      bgStyle += `background-repeat: no-repeat;`;

      if (props.textureOptions.resizeMode?.type) {
        bgStyle += `background-size: ${props.textureOptions.resizeMode.type}; background-position: center;`;
      } else if (srcPos !== null) {
        bgStyle += `background-position: -${srcPos.x}px -${srcPos.y}px;`;
      } else {
        bgStyle += 'background-size: 100% 100%;';
      }

      if (maskStyle !== '') {
        bgStyle += maskStyle;
      }
      // separate layers are needed for the mask
      if (maskStyle !== '' && node.divBg == null) {
        node.div.appendChild((node.divBg = document.createElement('div')));
        node.div.appendChild((node.divBorder = document.createElement('div')));
      }
    } else if (gradient) {
      bgStyle += `background-image: ${gradient};`;
      bgStyle += `background-repeat: no-repeat;`;
      bgStyle += `background-size: 100% 100%;`;
    } else if (props.color !== 0) {
      bgStyle += `background-color: ${colorToRgba(props.color)};`;
    }

    if (props.shader?.props != null) {
      let shader = props.shader.props;

      let borderWidth = shader['border-w'];
      let borderColor = shader['border-color'];
      let borderGap = shader['border-gap'] ?? 0;
      let borderInset = shader['border-inset'] ?? true;
      let radius = shader['radius'];

      // Border
      if (
        typeof borderWidth === 'number' &&
        borderWidth !== 0 &&
        typeof borderColor === 'number' &&
        borderColor !== 0
      ) {
        // Handle inset borders by making gap negative
        let gap = borderInset ? -(borderWidth + borderGap) : borderGap;

        borderStyle += `outline: ${borderWidth}px solid ${colorToRgba(borderColor)};`;
        borderStyle += `outline-offset: ${gap}px;`;
      }
      // Rounded
      if (typeof radius === 'number' && radius > 0) {
        radiusStyle += `border-radius: ${radius}px;`;
      } else if (Array.isArray(radius) && radius.length === 4) {
        radiusStyle += `border-radius: ${radius[0]}px ${radius[1]}px ${radius[2]}px ${radius[3]}px;`;
      }
    }

    style += radiusStyle;
    bgStyle += radiusStyle;
    borderStyle += radiusStyle;

    if (node.divBg == null) {
      style += bgStyle;
    } else {
      bgStyle += 'position: absolute; inset: 0; z-index: -1;';
      node.divBg.setAttribute('style', bgStyle);
    }
    if (node.divBorder == null) {
      style += borderStyle;
    } else {
      borderStyle += 'position: absolute; inset: 0; z-index: -1;';
      node.divBorder.setAttribute('style', borderStyle);
    }
  }

  node.div.setAttribute('style', style);
}

const fontFamiliesToLoad = new Set<string>();

const textNodesToMeasure = new Set<DOMText>();

type Size = { width: number; height: number };

function getElSize(node: DOMNode): Size {
  let rect = node.div.getBoundingClientRect();

  let dpr = Config.rendererOptions?.deviceLogicalPixelRatio ?? 1;
  rect.height /= dpr;
  rect.width /= dpr;

  for (;;) {
    if (node.props.scale != null && node.props.scale !== 1) {
      rect.height /= node.props.scale;
      rect.width /= node.props.scale;
    } else {
      rect.height /= node.props.scaleY;
      rect.width /= node.props.scaleX;
    }

    if (node.parent instanceof DOMNode) {
      node = node.parent;
    } else {
      break;
    }
  }

  return rect;
}

/*
  Text nodes with contain 'width' or 'none'
  need to have their height or width calculated.
  And then cause the flex layout to be recalculated.
*/
function updateDOMTextSize(node: DOMText): void {
  let size: Size;
  switch (node.contain) {
    case 'width':
      size = getElSize(node);
      if (node.props.h !== size.height) {
        node.props.h = size.height;
        updateNodeStyles(node);
        node.emit('loaded');
      }
      break;
    case 'none':
      size = getElSize(node);
      if (node.props.h !== size.height || node.props.w !== size.width) {
        node.props.w = size.width;
        node.props.h = size.height;
        updateNodeStyles(node);
        node.emit('loaded');
      }
      break;
  }
}

function updateDOMTextMeasurements() {
  textNodesToMeasure.forEach(updateDOMTextSize);
  textNodesToMeasure.clear();
}

function scheduleUpdateDOMTextMeasurement(node: DOMText) {
  /*
    Make sure the font is loaded before measuring
  */
  if (node.fontFamily && !fontFamiliesToLoad.has(node.fontFamily)) {
    fontFamiliesToLoad.add(node.fontFamily);
    document.fonts.load(`16px ${node.fontFamily}`);
  }

  if (textNodesToMeasure.size === 0) {
    if (document.fonts.status === 'loaded') {
      setTimeout(updateDOMTextMeasurements);
    } else {
      document.fonts.ready.then(updateDOMTextMeasurements);
    }
  }

  textNodesToMeasure.add(node);
}

function updateNodeData(node: DOMNode | DOMText) {
  for (let key in node.data) {
    let keyValue: unknown = node.data[key];
    if (keyValue === undefined) {
      node.div.removeAttribute('data-' + key);
    } else {
      node.div.setAttribute('data-' + key, String(keyValue));
    }
  }
}

function resolveNodeDefaults(
  props: Partial<IRendererNodeProps>,
): IRendererNodeProps {
  const color = props.color ?? 0xffffffff;

  return {
    x: props.x ?? 0,
    y: props.y ?? 0,
    w: props.w ?? 0,
    h: props.h ?? 0,
    alpha: props.alpha ?? 1,
    autosize: props.autosize ?? false,
    boundsMargin: props.boundsMargin ?? null,
    clipping: props.clipping ?? false,
    color,
    colorTop: props.colorTop ?? color,
    colorBottom: props.colorBottom ?? color,
    colorLeft: props.colorLeft ?? color,
    colorRight: props.colorRight ?? color,
    colorBl: props.colorBl ?? props.colorBottom ?? props.colorLeft ?? color,
    colorBr: props.colorBr ?? props.colorBottom ?? props.colorRight ?? color,
    colorTl: props.colorTl ?? props.colorTop ?? props.colorLeft ?? color,
    colorTr: props.colorTr ?? props.colorTop ?? props.colorRight ?? color,
    zIndex: props.zIndex ?? 0,
    parent: props.parent ?? null,
    texture: props.texture ?? null,
    textureOptions: props.textureOptions ?? {},
    shader: props.shader ?? defaultShader,
    // Since setting the `src` will trigger a texture load, we need to set it after
    // we set the texture. Otherwise, problems happen.
    src: props.src ?? null,
    srcHeight: props.srcHeight,
    srcWidth: props.srcWidth,
    srcX: props.srcX,
    srcY: props.srcY,
    scale: props.scale ?? null,
    scaleX: props.scaleX ?? props.scale ?? 1,
    scaleY: props.scaleY ?? props.scale ?? 1,
    mount: props.mount ?? 0,
    mountX: props.mountX ?? props.mount ?? 0,
    mountY: props.mountY ?? props.mount ?? 0,
    pivot: props.pivot ?? 0.5,
    pivotX: props.pivotX ?? props.pivot ?? 0.5,
    pivotY: props.pivotY ?? props.pivot ?? 0.5,
    rotation: props.rotation ?? 0,
    rtt: props.rtt ?? false,
    data: {},
    imageType: props.imageType,
  };
}

function resolveTextNodeDefaults(
  props: Partial<IRendererTextNodeProps>,
): IRendererTextNodeProps {
  return {
    ...resolveNodeDefaults(props),
    text: props.text ?? '',
    textRendererOverride: props.textRendererOverride ?? null,
    fontSize: props.fontSize ?? 16,
    fontFamily: props.fontFamily ?? 'sans-serif',
    fontStyle: props.fontStyle ?? 'normal',
    fontWeight: props.fontWeight ?? 'normal',
    forceLoad: props.forceLoad ?? false,
    textAlign: props.textAlign ?? 'left',
    contain: props.contain ?? 'none',
    offsetY: props.offsetY ?? 0,
    letterSpacing: props.letterSpacing ?? 0,
    lineHeight: props.lineHeight ?? 0,
    maxLines: props.maxLines ?? 0,
    maxWidth: props.maxWidth ?? 0,
    maxHeight: props.maxHeight ?? 0,
    verticalAlign: props.verticalAlign ?? 'middle',
    overflowSuffix: props.overflowSuffix ?? '...',
    wordBreak: props.wordBreak ?? 'overflow',
  };
}

const defaultShader: IRendererShader = {
  shaderType: '',
  props: undefined,
};

let lastNodeId = 0;

class DOMNode extends EventEmitter implements IRendererNode {
  div = document.createElement('div');
  divBg: HTMLElement | undefined;
  divBorder: HTMLElement | undefined;

  id = ++lastNodeId;

  renderState: lng.CoreNodeRenderState = 0 /* Init */;

  constructor(
    public stage: IRendererStage,
    public props: IRendererNodeProps,
  ) {
    super();

    // @ts-ignore
    this.div._node = this;
    this.div.setAttribute('data-id', String(this.id));
    elMap.set(this, this.div);

    updateNodeParent(this);
    updateNodeStyles(this);
    updateNodeData(this);
  }

  destroy(): void {
    elMap.delete(this);
    this.div.parentNode!.removeChild(this.div);
  }

  get parent() {
    return this.props.parent;
  }
  set parent(value: IRendererNode | null) {
    this.props.parent = value;
    updateNodeParent(this);
  }

  animate = animate;

  get x() {
    return this.props.x;
  }
  set x(v) {
    this.props.x = v;
    updateNodeStyles(this);
  }
  get y() {
    return this.props.y;
  }
  set y(v) {
    this.props.y = v;
    updateNodeStyles(this);
  }
  get w() {
    return this.props.w;
  }
  set w(v) {
    this.props.w = v;
    updateNodeStyles(this);
  }
  get h() {
    return this.props.h;
  }
  set h(v) {
    this.props.h = v;
    updateNodeStyles(this);
  }
  get width() {
    return this.props.w;
  }
  set width(v) {
    this.props.w = v;
    updateNodeStyles(this);
  }
  get height() {
    return this.props.h;
  }
  set height(v) {
    this.props.h = v;
    updateNodeStyles(this);
  }
  get alpha() {
    return this.props.alpha;
  }
  set alpha(v) {
    this.props.alpha = v;
    updateNodeStyles(this);
  }
  get autosize() {
    return this.props.autosize;
  }
  set autosize(v) {
    this.props.autosize = v;
    updateNodeStyles(this);
  }
  get clipping() {
    return this.props.clipping;
  }
  set clipping(v) {
    this.props.clipping = v;
    updateNodeStyles(this);
  }
  get color() {
    return this.props.color;
  }
  set color(v) {
    this.props.color = v;
    updateNodeStyles(this);
  }
  get colorTop() {
    return this.props.colorTop;
  }
  set colorTop(v) {
    this.props.colorTop = v;
    updateNodeStyles(this);
  }
  get colorBottom() {
    return this.props.colorBottom;
  }
  set colorBottom(v) {
    this.props.colorBottom = v;
    updateNodeStyles(this);
  }
  get colorLeft() {
    return this.props.colorLeft;
  }
  set colorLeft(v) {
    this.props.colorLeft = v;
    updateNodeStyles(this);
  }
  get colorRight() {
    return this.props.colorRight;
  }
  set colorRight(v) {
    this.props.colorRight = v;
    updateNodeStyles(this);
  }
  get colorTl() {
    return this.props.colorTl;
  }
  set colorTl(v) {
    this.props.colorTl = v;
    updateNodeStyles(this);
  }
  get colorTr() {
    return this.props.colorTr;
  }
  set colorTr(v) {
    this.props.colorTr = v;
    updateNodeStyles(this);
  }
  get colorBr() {
    return this.props.colorBr;
  }
  set colorBr(v) {
    this.props.colorBr = v;
    updateNodeStyles(this);
  }
  get colorBl() {
    return this.props.colorBl;
  }
  set colorBl(v) {
    this.props.colorBl = v;
    updateNodeStyles(this);
  }
  get zIndex() {
    return this.props.zIndex;
  }
  set zIndex(v) {
    this.props.zIndex = v;
    updateNodeStyles(this);
  }
  get texture() {
    return this.props.texture;
  }
  set texture(v) {
    this.props.texture = v;
    updateNodeStyles(this);
  }
  get textureOptions(): IRendererNode['textureOptions'] {
    return this.props.textureOptions;
  }
  set textureOptions(v) {
    this.props.textureOptions = v;
    updateNodeStyles(this);
  }
  get src() {
    return this.props.src;
  }
  set src(v) {
    this.props.src = v;
    updateNodeStyles(this);
  }
  get scale() {
    return this.props.scale ?? 1;
  }
  set scale(v) {
    this.props.scale = v;
    updateNodeStyles(this);
  }
  get scaleX() {
    return this.props.scaleX;
  }
  set scaleX(v) {
    this.props.scaleX = v;
    updateNodeStyles(this);
  }
  get scaleY() {
    return this.props.scaleY;
  }
  set scaleY(v) {
    this.props.scaleY = v;
    updateNodeStyles(this);
  }
  get mount() {
    return this.props.mount;
  }
  set mount(v) {
    this.props.mount = v;
    updateNodeStyles(this);
  }
  get mountX() {
    return this.props.mountX;
  }
  set mountX(v) {
    this.props.mountX = v;
    updateNodeStyles(this);
  }
  get mountY() {
    return this.props.mountY;
  }
  set mountY(v) {
    this.props.mountY = v;
    updateNodeStyles(this);
  }
  get pivot() {
    return this.props.pivot;
  }
  set pivot(v) {
    this.props.pivot = v;
    updateNodeStyles(this);
  }
  get pivotX() {
    return this.props.pivotX;
  }
  set pivotX(v) {
    this.props.pivotX = v;
    updateNodeStyles(this);
  }
  get pivotY() {
    return this.props.pivotY;
  }
  set pivotY(v) {
    this.props.pivotY = v;
    updateNodeStyles(this);
  }
  get rotation() {
    return this.props.rotation;
  }
  set rotation(v) {
    this.props.rotation = v;
    updateNodeStyles(this);
  }
  get rtt() {
    return this.props.rtt;
  }
  set rtt(v) {
    this.props.rtt = v;
    updateNodeStyles(this);
  }
  get shader() {
    return this.props.shader;
  }
  set shader(v) {
    this.props.shader = v;
    updateNodeStyles(this);
  }
  get data(): IRendererNode['data'] {
    return this.props.data;
  }
  set data(v) {
    this.props.data = v;
    updateNodeData(this);
  }

  get imageType() {
    return this.props.imageType;
  }
  set imageType(v) {
    this.props.imageType = v;
  }
  get srcWidth() {
    return this.props.srcWidth;
  }
  set srcWidth(v) {
    this.props.srcWidth = v;
  }
  get srcHeight() {
    return this.props.srcHeight;
  }
  set srcHeight(v) {
    this.props.srcHeight = v;
  }
  get srcX() {
    return this.props.srcX;
  }
  set srcX(v) {
    this.props.srcX = v;
  }
  get srcY() {
    return this.props.srcY;
  }
  set srcY(v) {
    this.props.srcY = v;
  }

  get boundsMargin(): number | [number, number, number, number] | null {
    return this.props.boundsMargin;
  }
  set boundsMargin(value: number | [number, number, number, number] | null) {
    this.props.boundsMargin = value;
  }

  get absX(): number {
    return this.x + -this.width * this.mountX + (this.parent?.absX ?? 0);
  }
  get absY(): number {
    return this.y + -this.height * this.mountY + (this.parent?.absY ?? 0);
  }
}

class DOMText extends DOMNode {
  constructor(
    stage: IRendererStage,
    public override props: IRendererTextNodeProps,
  ) {
    super(stage, props);
    this.div.innerText = props.text;
  }

  get text() {
    return this.props.text;
  }
  set text(v) {
    this.props.text = v;
    this.div.innerText = v;
    scheduleUpdateDOMTextMeasurement(this);
  }
  get fontFamily() {
    return this.props.fontFamily;
  }
  set fontFamily(v) {
    this.props.fontFamily = v;
    updateNodeStyles(this);
  }
  get fontSize() {
    return this.props.fontSize;
  }
  set fontSize(v) {
    this.props.fontSize = v;
    updateNodeStyles(this);
  }
  get fontStyle() {
    return this.props.fontStyle;
  }
  set fontStyle(v) {
    this.props.fontStyle = v;
    updateNodeStyles(this);
  }
  get fontWeight() {
    return this.props.fontWeight;
  }
  set fontWeight(v) {
    this.props.fontWeight = v;
    updateNodeStyles(this);
  }
  get forceLoad() {
    return this.props.forceLoad;
  }
  set forceLoad(v) {
    this.props.forceLoad = v;
  }
  get lineHeight() {
    return this.props.lineHeight;
  }
  set lineHeight(v) {
    this.props.lineHeight = v;
    updateNodeStyles(this);
  }
  get maxWidth() {
    return this.props.maxWidth;
  }
  set maxWidth(v) {
    this.props.maxWidth = v;
    updateNodeStyles(this);
  }
  get maxHeight() {
    return this.props.maxHeight;
  }
  set maxHeight(v) {
    this.props.maxHeight = v;
    updateNodeStyles(this);
  }
  get letterSpacing() {
    return this.props.letterSpacing;
  }
  set letterSpacing(v) {
    this.props.letterSpacing = v;
    updateNodeStyles(this);
  }
  get textAlign() {
    return this.props.textAlign;
  }
  set textAlign(v) {
    this.props.textAlign = v;
    updateNodeStyles(this);
  }
  get overflowSuffix() {
    return this.props.overflowSuffix;
  }
  set overflowSuffix(v) {
    this.props.overflowSuffix = v;
    updateNodeStyles(this);
  }
  get maxLines() {
    return this.props.maxLines;
  }
  set maxLines(v) {
    this.props.maxLines = v;
    updateNodeStyles(this);
  }
  get contain() {
    return this.props.contain;
  }
  set contain(v) {
    this.props.contain = v;
    updateNodeStyles(this);
  }
  get verticalAlign() {
    return this.props.verticalAlign;
  }
  set verticalAlign(v) {
    this.props.verticalAlign = v;
    updateNodeStyles(this);
  }
  get textRendererOverride() {
    return this.props.textRendererOverride;
  }
  set textRendererOverride(v) {
    this.props.textRendererOverride = v;
    updateNodeStyles(this);
  }
  get offsetY() {
    return this.props.offsetY;
  }
  set offsetY(v) {
    this.props.offsetY = v;
    updateNodeStyles(this);
  }
  get wordBreak() {
    return this.props.wordBreak;
  }
  set wordBreak(v) {
    this.props.wordBreak = v;
    updateNodeStyles(this);
  }
}

function updateRootPosition(this: DOMRendererMain) {
  let { canvas, settings } = this;

  let rect = canvas.getBoundingClientRect();
  let top = document.documentElement.scrollTop + rect.top;
  let left = document.documentElement.scrollLeft + rect.left;

  let dpr = settings.deviceLogicalPixelRatio ?? 1;

  let height = Math.ceil(settings.appHeight ?? 1080 / dpr);
  let width = Math.ceil(settings.appWidth ?? 1920 / dpr);

  this.root.div.style.left = `${left}px`;
  this.root.div.style.top = `${top}px`;
  this.root.div.style.width = `${width}px`;
  this.root.div.style.height = `${height}px`;
  this.root.div.style.position = 'absolute';
  this.root.div.style.transformOrigin = '0 0 0';
  this.root.div.style.transform = `scale(${dpr}, ${dpr})`;
  this.root.div.style.overflow = 'hidden';
}

export class DOMRendererMain implements IRendererMain {
  root: DOMNode;
  canvas: HTMLCanvasElement;

  stage: IRendererStage;

  constructor(
    public settings: lng.RendererMainSettings,
    rawTarget: string | HTMLElement,
  ) {
    let target: HTMLElement;
    if (typeof rawTarget === 'string') {
      let result = document.getElementById(rawTarget);
      if (result instanceof HTMLElement) {
        target = result;
      } else {
        throw new Error(`Target #${rawTarget} not found`);
      }
    } else {
      target = rawTarget;
    }

    let canvas = document.body.appendChild(document.createElement('canvas'));
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';

    this.canvas = canvas;

    this.stage = {
      root: null!,
      renderer: {
        mode: 'canvas',
      },
      loadFont: async () => {},
      shManager: {
        registerShaderType() {},
      },
      animationManager: {
        registerAnimation() {},
        unregisterAnimation() {},
      },
      cleanup() {},
    };

    this.root = new DOMNode(
      this.stage,
      resolveNodeDefaults({
        w: settings.appWidth ?? 1920,
        h: settings.appHeight ?? 1080,
        shader: defaultShader,
        zIndex: 65534,
      }),
    );
    this.stage.root = this.root;
    target.appendChild(this.root.div);

    if (Config.fontSettings.fontFamily) {
      this.root.div.style.fontFamily = Config.fontSettings.fontFamily;
    }
    if (Config.fontSettings.fontSize) {
      this.root.div.style.fontSize = Config.fontSettings.fontSize + 'px';
    }
    if (Config.fontSettings.lineHeight) {
      this.root.div.style.lineHeight = Config.fontSettings.lineHeight + 'px';
    } else {
      this.root.div.style.lineHeight = '1.2';
    }
    if (Config.fontSettings.fontWeight) {
      if (typeof Config.fontSettings.fontWeight === 'number') {
        this.root.div.style.fontWeight = Config.fontSettings.fontWeight + 'px';
      } else {
        this.root.div.style.fontWeight = Config.fontSettings.fontWeight;
      }
    }

    updateRootPosition.call(this);

    new MutationObserver(updateRootPosition.bind(this)).observe(this.canvas, {
      attributes: true,
    });
    new ResizeObserver(updateRootPosition.bind(this)).observe(this.canvas);
    window.addEventListener('resize', updateRootPosition.bind(this));
  }

  createNode(props: Partial<IRendererNodeProps>): IRendererNode {
    return new DOMNode(this.stage, resolveNodeDefaults(props));
  }

  createTextNode(props: Partial<IRendererTextNodeProps>): IRendererTextNode {
    return new DOMText(this.stage, resolveTextNodeDefaults(props));
  }

  createShader(
    shaderType: string,
    props?: IRendererShaderProps,
  ): IRendererShader {
    return { shaderType, props, program: {} };
  }

  createTexture(
    textureType: keyof lng.TextureMap,
    props: IRendererTextureProps,
  ): IRendererTexture {
    let type = lng.TextureType.generic;
    switch (textureType) {
      case 'SubTexture':
        type = lng.TextureType.subTexture;
        break;
      case 'ImageTexture':
        type = lng.TextureType.image;
        break;
      case 'ColorTexture':
        type = lng.TextureType.color;
        break;
      case 'NoiseTexture':
        type = lng.TextureType.noise;
        break;
      case 'RenderTexture':
        type = lng.TextureType.renderToTexture;
        break;
    }
    return { type, props };
  }

  on(name: string, callback: (target: any, data: any) => void) {
    console.log('on', name, callback);
  }
}
