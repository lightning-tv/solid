import {
  IRendererNode,
  IRendererNodeProps,
  IRendererShader,
  IRendererShaderProps,
  IRendererTextNode,
  IRendererTextNodeProps,
  renderer,
} from './lightningInit.js';
import {
  type BorderRadius,
  type BorderStyle,
  type StyleEffects,
  type AnimationSettings,
  type ElementText,
  type Styles,
  type AnimationEvents,
  type AnimationEventHandler,
  AddColorString,
  TextProps,
  TextNode,
  type OnEvent,
  NewOmit,
} from './intrinsicTypes.js';
import States, { type NodeStates } from './states.js';
import calculateFlex from './flex.js';
import {
  log,
  isArray,
  isFunc,
  keyExists,
  isINode,
  isElementNode,
  isElementText,
  logRenderTree,
  isFunction,
  spliceItem,
} from './utils.js';
import { Config, DOM_RENDERING, isDev, SHADERS_ENABLED } from './config.js';
import type {
  RendererMain,
  INode,
  INodeAnimateProps,
  IAnimationController,
  LinearGradientProps,
  RadialGradientProps,
  ShadowProps,
  CoreShaderNode,
} from '@lightningjs/renderer';
import { assertTruthy } from '@lightningjs/renderer/utils';
import { NodeType } from './nodeTypes.js';
import {
  ForwardFocusHandler,
  setActiveElement,
  FocusNode,
} from './focusManager.js';
import simpleAnimation, { SimpleAnimationSettings } from './animation.js';

let layoutRunQueued = false;
const layoutQueue = new Set<ElementNode>();

function addToLayoutQueue(node: ElementNode) {
  layoutQueue.add(node);
  if (!layoutRunQueued) {
    layoutRunQueued = true;
    queueMicrotask(runLayout);
  }
}

function runLayout() {
  while (layoutQueue.size > 0) {
    const queue = [...layoutQueue];
    layoutQueue.clear();
    for (let i = queue.length - 1; i >= 0; i--) {
      const node = queue[i] as ElementNode;
      node.updateLayout();
    }
  }
  layoutRunQueued = false;
}

const parseAndAssignShaderProps = (
  prefix: string,
  obj: Record<string, any>,
  props: Record<string, any> = {},
) => {
  if (!obj) return;
  props[prefix] = obj;
  Object.entries(obj).forEach(([key, value]) => {
    let transformedKey = key === 'width' ? 'w' : key;
    props[`${prefix}-${transformedKey}`] = value;
  });
};

function convertToShader(_node: ElementNode, v: StyleEffects): IRendererShader {
  let type = 'rounded';
  if (v.border) type += 'WithBorder';
  if (v.shadow) type += 'WithShadow';

  const customSuffix = Config.customShaderTypeSuffix?.(_node, v);
  if (customSuffix) type += customSuffix;

  return renderer.createShader(type, v as IRendererShaderProps);
}

function getPropertyAlias(name: string) {
  if (name === 'w') return 'width';
  if (name === 'h') return 'height';
  return name;
}

export const LightningRendererNumberProps = [
  'alpha',
  'color',
  'colorTop',
  'colorRight',
  'colorLeft',
  'colorBottom',
  'colorTl',
  'colorTr',
  'colorBl',
  'colorBr',
  'h',
  'fontSize',
  'lineHeight',
  'mount',
  'mountX',
  'mountY',
  'pivot',
  'pivotX',
  'pivotY',
  'rotation',
  'scale',
  'scaleX',
  'scaleY',
  'w',
  'worldX',
  'worldY',
  'x',
  'y',
  'zIndex',
  'zIndexLocked',
];

const LightningRendererNonAnimatingProps = [
  'absX',
  'absY',
  'autosize',
  'clipping',
  'contain',
  'data',
  'destroyed',
  'fontStretch',
  'fontStyle',
  'imageType',
  'letterSpacing',
  'maxHeight',
  'maxLines',
  'maxWidth',
  'offsetY',
  'overflowSuffix',
  'preventCleanup',
  'rtt',
  'scrollable',
  'scrollY',
  'srcHeight',
  'srcWidth',
  'srcX',
  'srcY',
  'strictBounds',
  'text',
  'textAlign',
  'textBaseline',
  'textOverflow',
  'texture',
  'textureOptions',
  'verticalAlign',
  'wordWrap',
];

declare global {
  interface HTMLElement {
    /** Assigned for development, to quickly get ElementNode from selected HTMLElement */
    element?: ElementNode;
  }
}

export type RendererNode = AddColorString<
  Partial<
    NewOmit<
      INode,
      'parent' | 'shader' | 'src' | 'children' | 'id' | 'removeChild'
    >
  >
>;
export interface ElementNode extends RendererNode, FocusNode {
  [key: string]: unknown;

  // Properties
  /** @internal for managing series of insertions and deletions */
  _queueDelete?: number;
  preserve?: boolean;
  _animationQueue?:
    | Array<{
        props: Partial<INodeAnimateProps<CoreShaderNode>>;
        animationSettings?: AnimationSettings;
      }>
    | undefined;
  _animationQueueSettings?: AnimationSettings;
  _animationRunning?: boolean;
  _animationSettings?: AnimationSettings;
  _autofocus?: boolean;
  _containsFlexGrow?: boolean | null;
  _hasRenderedChildren?: boolean;
  _effects?: Record<string, any>;
  _fontFamily?: string;
  _id: string | undefined;
  _parent: ElementNode | undefined;
  _rendererProps?: any;
  _states?: States;
  _style?: Styles;
  _lastAnyKeyPressTime?: number;
  _type: 'element' | 'textNode';
  _undoStyles?: string[];
  autosize?: boolean;
  /**
   * The distance from the bottom edge of the parent element.
   * When `bottom` is set, `mountY` is automatically set to 1.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  bottom?: number;
  /**
   * An array of child `ElementNode` or `ElementText` nodes.
   */
  children: Array<ElementNode | ElementText>;
  /**
   * Enable debug logging for this specific node.
   */
  debug?: boolean;
  /**
   * Specifies how much a flex item should grow relative to the rest of the flex items.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex-grow
   */
  flexGrow?: number;
  /**
   * Specifies whether flex items are forced onto one line or can wrap onto multiple lines.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  flexWrap?: 'nowrap' | 'wrap';
  /**
   * Determines if an element is a flex item. If set to `false`, the element will be ignored by the flexbox layout.
   * @default false
   */
  flexItem?: boolean;
  /**
   * Specifies the order of a flex item relative to the rest of the flex items.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  flexOrder?: number;
  /**
   * Forwards focus to a child element. It can be a numeric index of the child or a handler function.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/focus?id=forwardfocus
   */
  forwardFocus?: number | ForwardFocusHandler;
  /**
   * If `true`, the states of this node will be propagated to its children.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/states?id=forwardstates
   */
  forwardStates?: boolean;
  /**
   * The underlying Lightning Renderer node object. This is where the properties are ultimately set for rendering.
   */
  lng:
    | Partial<ElementNode>
    | IRendererNode
    | (IRendererTextNode & { shader?: any });
  /**
   * A reference to the `ElementNode` instance. Can be an object or a callback function.
   */
  ref?: ElementNode | ((node: ElementNode) => void) | undefined;
  /**
   * A boolean indicating whether the node has been rendered.
   */
  rendered: boolean;
  /**
   * The main renderer instance.
   */
  renderer?: RendererMain;
  /**
   * The distance from the right edge of the parent element.
   * When `right` is set, `mountX` is automatically set to 1.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=layout-and-positioning-elements
   */
  right?: number;
  /**
   * The index of the currently selected child element, used for focus management for Column and Row components.
   */
  selected?: number;
  /**
   * The width of the element before flexbox layout is applied. Used internally for layout calculations.
   */
  preFlexwidth?: number;
  /**
   * The height of the element before flexbox layout is applied. Used internally for layout calculations.
   */
  preFlexheight?: number;
  /**
   * The text content of a text node.
   */
  text?: string;
  /**
   * Aligns flex items along the cross axis of the current line of the flex container.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex-properties
   */
  alignItems?: 'flexStart' | 'flexEnd' | 'center';
  /**
   * Aligns a flex item along the cross axis, overriding the `alignItems` value of the flex container.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex-properties
   */
  alignSelf?: 'flexStart' | 'flexEnd' | 'center';
  /**
   * The border style for all sides of the element. Takes an object with width and color properties.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/effects?id=border-and-borderradius
   */
  border?: BorderStyle;
  /**
   * The border style for the bottom side of the element.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/effects?id=border-and-borderradius
   */
  borderBottom?: BorderStyle;
  /**
   * The border style for the left side of the element.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/effects?id=border-and-borderradius
   */
  borderLeft?: BorderStyle;
  /**
   * The radius of the element's corners.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/effects?id=border-and-borderradius
   */
  borderRadius?: BorderRadius;
  /**
   * The border style for the right side of the element.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/effects?id=border-and-borderradius
   */
  borderRight?: BorderStyle;
  /**
   * The border style for the top side of the element.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/effects?id=border-and-borderradius
   */
  borderTop?: BorderStyle;
  /**
   * A shorthand to set both `centerX` and `centerY` to true.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=layout-and-positioning-elements
   */
  center?: boolean;
  /**
   * If `true`, centers the element horizontally within its parent.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=layout-and-positioning-elements
   */
  centerX?: boolean;
  /**
   * If `true`, centers the element vertically within its parent.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=layout-and-positioning-elements
   */
  centerY?: boolean;
  /**
   * Specifies the direction of the flex items.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  direction?: 'ltr' | 'rtl';
  /**
   * Specifies the display behavior of an element. 'flex' enables flexbox layout.
   *
   * @default 'block'
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  display?: 'flex' | 'block';
  /**
   * Defines how the flex container's size is determined. 'contain' allows it to grow with its content, 'fixed' keeps it at its specified size.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  flexBoundary?: 'contain' | 'fixed';
  /**
   * Defines how the flex container's cross-axis size is determined. 'fixed' keeps it at its specified size. Default is 'contain'.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  flexCrossBoundary?: 'fixed'; // default is contain
  /**
   * Specifies the direction of the main axis for flex items.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  flexDirection?: 'row' | 'column';
  /**
   * The gap between flex items.
   *
   * @see @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  gap?: number;
  /**
   * The gap between flex rows.
   *
   * @see @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  rowGap?: number;
  /**
   * The gap between flex columns.
   *
   * @see @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  columnGap?: number;
  /**
   * Defines the alignment of flex items along the main axis.
   *
   * @see @see https://lightning-tv.github.io/solid/#/flow/layout?id=flex
   */
  justifyContent?:
    | 'flexStart'
    | 'flexEnd'
    | 'center'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly';
  /**
   * Applies a linear gradient effect to the element.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/effects
   */
  linearGradient?: LinearGradientProps;
  /**
   * Applies a radial gradient effect to the element.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/effects
   */
  radialGradient?: RadialGradientProps;
  /**
   * The margin on the bottom side of the element for a flexItem.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  marginBottom?: number;
  /**
   * The margin on the left side of the element for a flexItem.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  marginLeft?: number;
  /**
   * The margin on the right side of the element for a flexItem.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  marginRight?: number;
  /**
   * The margin on the top side of the element for a flexItem.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  marginTop?: number;
  /**
   * The padding on all sides of the flex element.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  padding?: number;
  /**
   * The x-coordinate of the element's position.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  x: number;
  /**
   * The y-coordinate of the element's position.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  y: number;
  /**
   * Throttles key press events by the specified number of milliseconds.
   *
   * @see https://lightning-tv.github.io/solid/#/primitives/useFocusManager?id=input-throttling-available-core-212
   */
  throttleInput?: number;
  /**
   * The width of the element.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  w: number;
  /**
   * The height of the element.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  h: number;
  /**
   * The maximum width of the element.
   */
  maxWidth?: number;
  /**
   * The maximum height of the element.
   */
  maxHeight?: number;
  /**
   * The minimum width of the element.
   */
  minWidth?: number;
  /**
   * The minimum height of the element.
   */
  minHeight?: number;
  /**
   * The z-index of the element, which affects its stacking order.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  zIndex?: number;
  /**
   * Defines transitions for animatable properties.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/transitions?id=transitions-animations
   */
  transition?:
    | Record<string, AnimationSettings | undefined | true | false>
    | true
    | false;
  /**
   * Optional handlers for animation events.
   *
   * Available animation events:
   * - 'animating': Fired when the animation is in progress.
   * - 'tick': Fired at each tick or frame update of the animation.
   * - 'stopped': Fired when the animation stops.
   *
   * Each event handler is optional and maps to a corresponding event.
   *
   * @type {Partial<Record<AnimationEvents, AnimationEventHandler>>}
   *
   * @property {AnimationEventHandler} [animating] - Handler for the 'animating' event.
   * @property {AnimationEventHandler} [tick] - Handler for the 'tick' event.
   * @property {AnimationEventHandler} [stopped] - Handler for the 'stopped' event.
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/transitions?id=animation-callbacks
   */
  onAnimation?: Partial<Record<AnimationEvents, AnimationEventHandler>>;
  /** Optional handler for when the element is created and rendered.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/ondestroy
   */
  onCreate?: (this: ElementNode, el: ElementNode) => void;
  /**
   * Optional handler for when the element is destroyed.
   * It can return a promise to wait for the cleanup to finish before the element is destroyed.
   *
   * @see https://lightning-tv.github.io/solid/#/flow/ondestroy
   */
  onDestroy?: (this: ElementNode, el: ElementNode) => Promise<any> | void;
  /**
   * Optional handlers for when the element is rendered—after creation and when switching parents.
   *
   * @see https://lightning-tv.github.io/solid/#/primitives/KeepAlive
   */
  onRender?: (this: ElementNode, el: ElementNode) => void;
  /**
   * Optional handlers for when the element is removed from a parent element.
   *
   * @see https://lightning-tv.github.io/solid/#/primitives/KeepAlive
   */
  onRemove?: (this: ElementNode, el: ElementNode) => void;
  /**
   * Listen to Events coming from the renderer
   * @param NodeEvents
   *
   * Available events:
   * - 'loaded'
   * - 'failed'
   * - 'freed'
   * - 'inBounds'
   * - 'outOfBounds'
   * - 'inViewport'
   * - 'outOfViewport'
   *
   * @typedef {'loaded' | 'failed' | 'freed' | 'inBounds' | 'outOfBounds' | 'inViewport' | 'outOfViewport'} NodeEvents
   *
   * @param {Partial<Record<NodeEvents, EventHandler>>} events - An object where the keys are event names from NodeEvents and the values are the respective event handlers.
   * @returns {void}
   *
   * @see https://lightning-tv.github.io/solid/#/essentials/events
   */
  onEvent?: OnEvent;

  /**
   * Callback run after flex layout is calculated on flex elements
   *
   * @see https://lightning-tv.github.io/solid/#/flow/layout
   */
  onLayout?: (this: ElementNode, target: ElementNode) => void;
}

export class ElementNode extends Object {
  constructor(name: string) {
    super();
    this._type = name === 'text' ? NodeType.TextNode : NodeType.Element;
    this.rendered = false;
    this.lng = {};
    this.children = [];
  }

  get effects(): StyleEffects | undefined {
    return this.lng.shader;
  }

  set effects(v: StyleEffects) {
    if (!SHADERS_ENABLED) return;
    let target = this.lng.shader || {};
    if (this.lng.shader?.program) {
      target = this.lng.shader.props;
    }
    if (v.rounded) target.radius = v.rounded.radius;
    if (v.borderRadius) target.radius = v.borderRadius;
    if (v.border) parseAndAssignShaderProps('border', v.border, target);
    if (v.shadow) parseAndAssignShaderProps('shadow', v.shadow, target);

    if (this.rendered) {
      if (!this.lng.shader) {
        this.lng.shader = convertToShader(this, target);
      } else if (DOM_RENDERING) {
        this.lng.shader = this.lng.shader; // lng.shader is a setter, force style update
      }
    } else {
      this.lng.shader = target;
    }
  }

  set id(id: string) {
    this._id = id;
    if (Config.rendererOptions?.inspector) {
      this.data = { ...this.data, testId: id };
    }
  }

  get id(): string | undefined {
    return this._id;
  }

  get parent() {
    return this._parent;
  }

  set parent(p) {
    this._parent = p;
    if (this.rendered && p?.rendered) {
      this.lng.parent = (p.lng as IRendererNode) ?? null;
    }
  }

  get height(): number {
    return this.maxHeight || this.h;
  }

  set height(h: number) {
    this.h = h;
  }

  get width(): number {
    return this.maxWidth || this.w;
  }

  set width(w: number) {
    this.w = w;
  }

  set fontWeight(v) {
    if (this._fontWeight === v) {
      return;
    }

    this._fontWeight = v;
    const weight =
      (Config.fontWeightAlias &&
        (Config.fontWeightAlias[v as string] as number | string)) ??
      v;
    (this.lng as any).fontFamily = `${this.fontFamily}${weight}`;
  }

  get fontWeight() {
    return this._fontWeight;
  }

  set fontFamily(v) {
    this._fontFamily = v;
    (this.lng as any).fontFamily = v;
  }

  get fontFamily() {
    return this._fontFamily || Config.fontSettings?.fontFamily;
  }

  insertChild(
    node: ElementNode | ElementText | TextNode,
    beforeNode?: ElementNode | ElementText | TextNode | null,
  ) {
    // always remove nodes if they have a parent - for back swap of node
    // this will then put the node at the end of the array when re-added
    if (node.parent) {
      node.parent.removeChild(node);

      // We're inserting a node thats been rendered into a node that hasn't been
      if (!this.rendered) {
        this._hasRenderedChildren = true;
      }
    }

    node.parent = this;

    if (beforeNode) {
      // SolidJS can move nodes around in the children array.
      // We need to insert following DOM insertBefore which moves elements.
      spliceItem(this.children, node as ElementNode, 1);
      if (spliceItem(this.children, beforeNode as ElementNode, 0, node) > -1) {
        return;
      }
    }

    this.children.push(node as ElementNode);
  }

  removeChild(node: ElementNode | ElementText | TextNode) {
    if (spliceItem(this.children, node, 1) > -1) {
      node.onRemove?.call(node, node);
      if (this.requiresLayout()) {
        addToLayoutQueue(this);
      }
    }
  }

  get selectedNode(): ElementNode | undefined {
    const selectedIndex = this.selected || 0;

    for (let i = selectedIndex; i < this.children.length; i++) {
      const element = this.children[i];
      if (isElementNode(element)) {
        this.selected = i;
        return element;
      }
    }

    return undefined;
  }

  set shader(
    shaderProps: IRendererShader | [kind: string, props: IRendererShaderProps],
  ) {
    this.lng.shader = isArray(shaderProps)
      ? renderer.createShader(...shaderProps)
      : shaderProps;
  }

  _sendToLightningAnimatable(name: string, value: number) {
    if (
      this.transition &&
      this.rendered &&
      Config.animationsEnabled &&
      (this.transition === true ||
        this.transition[name] ||
        this.transition[getPropertyAlias(name)])
    ) {
      const animationSettings =
        this.transition === true || this.transition[name] === true
          ? undefined
          : (this.transition[name] as undefined | AnimationSettings);

      if (Config.simpleAnimationsEnabled) {
        simpleAnimation.add(
          this,
          name,
          value,
          animationSettings ||
            (this.animationSettings as SimpleAnimationSettings),
        );
        simpleAnimation.register(renderer.stage);
        return;
      } else {
        const animationController = this.animate(
          { [name]: value },
          animationSettings,
        );

        if (this.onAnimation) {
          const animationEvents = Object.keys(
            this.onAnimation,
          ) as AnimationEvents[];
          for (const event of animationEvents) {
            const handler = this.onAnimation[event];
            animationController.on(
              event,
              (controller: IAnimationController, props?: any) => {
                handler!.call(this, controller, name, value, props);
              },
            );
          }
        }

        return animationController.start();
      }
    }

    (this.lng[name as keyof IRendererNode] as number | string) = value;
  }

  animate(
    props: Partial<INodeAnimateProps<CoreShaderNode>>,
    animationSettings?: AnimationSettings,
  ): IAnimationController {
    isDev &&
      assertTruthy(this.rendered, 'Node must be rendered before animating');
    return (this.lng as IRendererNode).animate(
      props,
      animationSettings || this.animationSettings || {},
    );
  }

  chain(
    props: Partial<INodeAnimateProps<CoreShaderNode>>,
    animationSettings?: AnimationSettings,
  ) {
    if (this._animationRunning) {
      this._animationQueue = [];
      this._animationRunning = false;
    }

    if (animationSettings) {
      this._animationQueueSettings = animationSettings;
    } else if (!this._animationQueueSettings) {
      this._animationQueueSettings =
        animationSettings || this.animationSettings;
    }
    animationSettings = animationSettings || this._animationQueueSettings;
    this._animationQueue = this._animationQueue || [];
    this._animationQueue.push({ props, animationSettings });
    return this;
  }

  async start() {
    let animation = this._animationQueue!.shift();
    while (animation) {
      this._animationRunning = true;
      await this.animate(animation.props, animation.animationSettings)
        .start()
        .waitUntilStopped();
      animation = this._animationQueue!.shift();
    }
    this._animationRunning = false;
    this._animationQueueSettings = undefined;
  }

  emit(event: string, ...args: any[]): boolean {
    let current = this as ElementNode;
    const capitalizedEvent = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;

    while (current) {
      const handler = current[capitalizedEvent];
      if (isFunction(handler)) {
        if (handler.call(current, this, ...args) === true) {
          return true;
        }
      }
      current = current.parent!;
    }
    return false;
  }

  setFocus(): void {
    if (this.rendered) {
      // can be 0
      if (this.forwardFocus !== undefined) {
        if (isFunc(this.forwardFocus)) {
          if (this.forwardFocus.call(this, this) !== false) {
            return;
          }
        } else {
          const focusedIndex =
            typeof this.forwardFocus === 'number' ? this.forwardFocus : null;
          const nodes = this.children;
          if (focusedIndex !== null && focusedIndex < nodes.length) {
            const child = nodes[focusedIndex];
            isElementNode(child) && child.setFocus();
            return;
          }
        }
      }
      // Delay setting focus so children can render (useful for Row + Column)
      queueMicrotask(() => setActiveElement(this));
    } else {
      this._autofocus = true;
    }
  }

  _layoutOnLoad() {
    (this.lng as IRendererNode).on('loaded', () => {
      this.parent!.updateLayout();
    });
  }

  getText(this: ElementText) {
    let result = '';
    for (let i = 0; i < this.children.length; i++) {
      result += this.children[i]!.text;
    }
    return result;
  }

  destroy() {
    if (this.onDestroy) {
      const destroyPromise: unknown = this.onDestroy(this);

      // If onDestroy returns a promise, wait for it to resolve before destroying
      // Useful with animations waitUntilStopped method which returns promise
      if (destroyPromise instanceof Promise) {
        destroyPromise.then(() => this._destroy());
      } else {
        this._destroy();
      }
    } else {
      this._destroy();
    }
  }

  _destroy() {
    if (isINode(this.lng)) {
      this.lng.destroy();
    }
  }

  set style(style: Styles | undefined) {
    if (isDev && this._style) {
      // Avoid processing style changes again
      console.warn(
        'Style already set: https://lightning-tv.github.io/solid/#/essentials/styling?id=style-patterns-to-avoid',
      );
    }

    if (Config.lockStyles && this._style) {
      return;
    }

    if (!style) {
      return;
    }

    this._style = style;

    // Keys set in JSX are more important
    for (const key in this._style) {
      // be careful of 0 values
      if (this[key as keyof Styles] === undefined) {
        this[key as keyof Styles] = this._style[key as keyof Styles];
      }
    }
  }

  get style(): Styles {
    return this._style || {};
  }

  get hasChildren() {
    return this.children.length > 0;
  }

  set src(src) {
    if (typeof src === 'string') {
      this.lng.src = src;
      if (!this.color && this.rendered) {
        this.color = 0xffffffff;
      }
    } else {
      this.color = 0x00000000;
    }
  }

  get src(): string | null | undefined {
    return this.lng.src;
  }

  getChildById(id: string) {
    return this.children.find((c) => c.id === id);
  }

  searchChildrenById(id: string): ElementNode | undefined {
    // traverse all the childrens children
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (isElementNode(child)) {
        if (child.id === id) {
          return child;
        }

        const found = child.searchChildrenById(id);
        if (found) {
          return found;
        }
      }
    }
  }

  set states(states: NodeStates) {
    this._states = this._states
      ? this._states.merge(states)
      : new States(this._stateChanged.bind(this), states);
    if (this.rendered) {
      this._stateChanged();
    }
  }

  get states(): States {
    this._states = this._states || new States(this._stateChanged.bind(this));
    return this._states;
  }

  get animationSettings(): AnimationSettings | undefined {
    return this._animationSettings || Config.animationSettings;
  }

  set animationSettings(animationSettings: AnimationSettings | undefined) {
    this._animationSettings = animationSettings;
  }

  set hidden(val: boolean) {
    this.alpha = val ? 0 : 1;
  }

  get hidden() {
    return this.alpha === 0;
  }

  /**
   * Sets the autofocus state of the element.
   * When set to a truthy value, the element will automatically gain focus.
   * You can also set it to a signal to recalculate
   *
   * @param val - A value to determine if the element should autofocus.
   *              A truthy value enables autofocus, otherwise disables it.
   */
  set autofocus(val: any) {
    this._autofocus = val;
    // Delay setting focus so children can render (useful for Row + Column)
    // which now uses forwardFocus
    val && queueMicrotask(() => this.setFocus());
  }

  get autofocus() {
    return this._autofocus;
  }

  requiresLayout() {
    return this.display === 'flex' || this.onLayout;
  }

  set updateLayoutOn(v: any) {
    this.updateLayout();
  }

  get updateLayoutOn() {
    return null;
  }

  updateLayout() {
    if (this.hasChildren) {
      isDev && log('Layout: ', this);

      if (this.display === 'flex' && this.flexGrow && this.width === 0) {
        return;
      }

      const flexChanged = this.display === 'flex' && calculateFlex(this);
      layoutQueue.delete(this);
      const onLayoutChanged =
        isFunc(this.onLayout) && this.onLayout.call(this, this);

      if ((flexChanged || onLayoutChanged) && this.parent) {
        addToLayoutQueue(this.parent);
      }

      if (this._containsFlexGrow === true) {
        // Need to reprocess children
        this.children.forEach((c) => {
          if (c.display === 'flex' && isElementNode(c)) {
            // calculating directly to prevent infinite loops recalculating parents
            calculateFlex(c);
            isFunc(c.onLayout) && c.onLayout.call(c, c);
            addToLayoutQueue(this);
          }
        });
      }
    }
  }

  _stateChanged() {
    isDev && log('State Changed: ', this, this.states);

    if (this.forwardStates) {
      // apply states to children first
      const states = this.states.slice() as States;
      this.children.forEach((c) => {
        c.states = states;
      });
    }

    const states = this.states;

    if (this._undoStyles || keyExists(this, states)) {
      let stylesToUndo: { [key: string]: any } | undefined;
      if (this._undoStyles && this._undoStyles.length) {
        stylesToUndo = {};
        this._undoStyles.forEach((styleKey) => {
          if (isDev) {
            if (this.style[styleKey] === undefined) {
              console.warn('fallback style key not found: ', styleKey);
            }
          }
          stylesToUndo![styleKey] = this.style[styleKey];
        });
      }

      const numStates = states.length;
      if (numStates === 0) {
        Object.assign(this, stylesToUndo);
        this._undoStyles = [];
        return;
      }

      let newStyles: Styles;
      if (numStates === 1) {
        newStyles = this[states[0] as keyof Styles] as Styles;
        newStyles = stylesToUndo
          ? { ...stylesToUndo, ...newStyles }
          : newStyles;
      } else {
        newStyles = states.reduce((acc, state) => {
          const styles = this[state];
          return styles ? { ...acc, ...styles } : acc;
        }, stylesToUndo || {});
      }

      if (newStyles) {
        this._undoStyles = Object.keys(newStyles);
        // Apply transition first
        if (newStyles.transition !== undefined) {
          this.transition = newStyles.transition as Styles['transition'];
        }

        // Apply the styles
        Object.assign(this, newStyles);
      } else {
        this._undoStyles = [];
      }
    }
  }

  render(topNode?: boolean) {
    // Elements are inserted from the inside out, then rendered from the outside in.
    // Render starts when an element is inserted with a parent that is already renderered.
    const node = this;
    const parent = this.parent;

    if (!parent) {
      console.warn('Parent not set - no node created for: ', this);
      return;
    }

    if (!parent.rendered) {
      console.warn('Parent not rendered yet: ', this);
      return;
    }

    if (parent.requiresLayout()) {
      layoutQueue.add(parent);
    }

    if (this.rendered) {
      // This happens if Array of items is reordered to reuse elements.
      // We return after layout is queued so the change can trigger layout updates.
      this.onRender?.(this);
      return;
    }

    if (this._states) {
      this._stateChanged();
    }

    const props = node.lng;
    const parentWidth = parent.w || 0;
    const parentHeight = parent.h || 0;

    props.x = props.x || 0;
    props.y = props.y || 0;
    props.parent = parent.lng as IRendererNode;

    if (this.right || this.right === 0) {
      props.x = parentWidth - this.right;
      props.mountX = 1;
    }

    if (this.bottom || this.bottom === 0) {
      props.y = parentHeight - this.bottom;
      props.mountY = 1;
    }

    if (this.center) {
      this.centerX = this.centerY = true;
    }

    if (this.centerX) {
      props.x += parentWidth / 2;
      props.mountX = 0.5;
    }

    if (this.centerY) {
      props.y += parentHeight / 2;
      props.mountY = 0.5;
    }

    if (isElementText(node)) {
      const textProps = props as TextProps;
      if (Config.fontSettings) {
        for (const key in Config.fontSettings) {
          if (textProps[key] === undefined) {
            textProps[key] = Config.fontSettings[key];
          }
        }
      }
      textProps.text = textProps.text || node.getText();

      if (textProps.textAlign && !textProps.contain) {
        console.warn('Text align requires contain: ', node.getText());
      }

      // contain is either width or both
      if (textProps.contain) {
        if (textProps.contain === 'both') {
          textProps.maxWidth = textProps.maxWidth ?? textProps.w;
          textProps.maxHeight = textProps.maxHeight ?? textProps.h;
        } else if (textProps.contain === 'width') {
          textProps.maxWidth = textProps.maxWidth ?? textProps.w;
        }

        if (!textProps.h && !textProps.maxHeight) {
          textProps.maxLines = textProps.maxLines ?? 99;
        }

        if (!textProps.maxWidth) {
          textProps.maxWidth =
            parentWidth - textProps.x! - (textProps.marginRight || 0);
        }

        if (textProps.contain === 'both' && !textProps.maxHeight) {
          textProps.maxHeight =
            parentHeight - textProps.y! - (textProps.marginBottom || 0);
        } else if (textProps.maxLines === 1) {
          textProps.maxHeight = (textProps.maxHeight ||
            textProps.lineHeight ||
            textProps.fontSize) as number;
        }

        textProps.w = textProps.h = undefined;
      }

      // Can you put effects on Text nodes? Need to confirm...
      if (SHADERS_ENABLED && props.shader && !props.shader.program) {
        props.shader = convertToShader(node, props.shader);
      }

      isDev && log('Rendering: ', this, props);
      node.lng = renderer.createTextNode(
        props as unknown as IRendererTextNodeProps,
      );
      if (parent.requiresLayout()) {
        if (!textProps.maxWidth || !textProps.maxHeight) {
          node._layoutOnLoad();
        }
      }
    } else {
      // If its not an image or texture apply some defaults
      if (!props.texture) {
        // Set width and height to parent less offset
        if (isNaN(props.w as number)) {
          props.w = node.flexGrow ? 0 : parentWidth - props.x;
          node._calcWidth = true;
        }

        if (isNaN(props.h as number)) {
          props.h = parentHeight - props.y;
          node._calcHeight = true;
        }

        if (props.rtt && !props.color) {
          props.color = 0xffffffff;
        }

        if (!props.color && !props.src) {
          // Default color to transparent - If you later set a src, you'll need
          // to set color '#ffffffff'
          props.color = 0x00000000;
        }
      }

      if (SHADERS_ENABLED && props.shader && !props.shader.program) {
        props.shader = convertToShader(node, props.shader);
      }

      isDev && log('Rendering: ', this, props);
      node.lng = renderer.createNode(props as IRendererNodeProps);

      if (node._hasRenderedChildren) {
        node._hasRenderedChildren = false;

        for (const child of node.children) {
          if (isElementNode(child) && isINode(child.lng)) {
            child.lng.parent = node.lng as any;
          }
        }
      }
    }

    node.rendered = true;
    if (isDev) {
      // Store props so we can recreate raw renderer code
      node._rendererProps = props;
    }

    if (node.autosize && parent.requiresLayout()) {
      node._layoutOnLoad();
    }

    this.onCreate?.(this);
    this.onRender?.(this);

    if (node.onEvent) {
      for (const [name, handler] of Object.entries(node.onEvent)) {
        node.lng.on(name, (_inode, data) => handler.call(node, node, data));
      }
    }

    // L3 Inspector adds div to the lng object
    if (node.lng?.div) {
      node.lng.div.element = node;
    }

    if (node._type === NodeType.Element) {
      // only element nodes will have children that need rendering
      const numChildren = node.children.length;
      for (let i = 0; i < numChildren; i++) {
        const c = node.children[i];
        isDev && assertTruthy(c, 'Child is undefined');
        // Text elements sneak in from Solid creating tracked nodes
        if (isElementNode(c)) {
          c.render();
        }
      }
    }
    if (topNode && !layoutRunQueued) {
      //Do one pass of layout, then another with Text loads
      layoutRunQueued = true;
      // We use queue because <For> loop will add children one at a time, causing lots of layout
      queueMicrotask(runLayout);
    }

    node._autofocus && node.setFocus();
  }
}

for (const key of LightningRendererNumberProps) {
  Object.defineProperty(ElementNode.prototype, key, {
    get(): number {
      return this.lng[key];
    },
    set(this: ElementNode, v: number) {
      this._sendToLightningAnimatable(key, v);
    },
  });
}

for (const key of LightningRendererNonAnimatingProps) {
  Object.defineProperty(ElementNode.prototype, key, {
    get(): unknown {
      return this.lng[key];
    },
    set(v: unknown) {
      this.lng[key] = v;
    },
  });
}

export function createRawShaderAccessor<T>(key: keyof StyleEffects) {
  return {
    set(this: ElementNode, value: T) {
      this.shader = [key, value as unknown as IRendererShaderProps];
    },

    get(this: ElementNode) {
      return this.shader;
    },
  };
}

export function shaderAccessor<T extends Record<string, any> | number>(
  key: 'border' | 'shadow' | 'rounded',
) {
  return {
    set(this: ElementNode, value: T) {
      let target = this.lng.shader || {};
      this._effects = this._effects || {};
      this._effects[key] = value;

      let animationSettings: AnimationSettings | undefined;
      if (this.lng.shader?.program) {
        target = this.lng.shader.props;
        const transitionKey = key === 'rounded' ? 'borderRadius' : key;
        if (
          this.transition &&
          (this.transition === true || this.transition[transitionKey])
        ) {
          target = {};
          animationSettings =
            this.transition === true || this.transition[transitionKey] === true
              ? undefined
              : (this.transition[transitionKey] as
                  | undefined
                  | AnimationSettings);
        }
      }

      if (key === 'rounded' || typeof value === 'number') {
        target.radius = value;
      } else {
        parseAndAssignShaderProps(key, value, target);
      }

      if (this.rendered) {
        if (!this.lng.shader) {
          this.lng.shader = convertToShader(this, target);
        }
      } else {
        this.lng.shader = target;
      }

      if (animationSettings) {
        this.animate({ shaderProps: target }, animationSettings).start();
      }
    },
    get(this: ElementNode) {
      return this._effects?.[key];
    },
  };
}

if (isDev) {
  ElementNode.prototype.lngTree = function () {
    return logRenderTree(this);
  };
}

Object.defineProperties(ElementNode.prototype, {
  border: shaderAccessor<BorderStyle>('border'),
  shadow: shaderAccessor<ShadowProps>('shadow'),
  rounded: shaderAccessor<BorderRadius>('rounded'),
  // Alias for rounded
  borderRadius: shaderAccessor<BorderRadius>('rounded'),
  linearGradient:
    createRawShaderAccessor<LinearGradientProps>('linearGradient'),
  radialGradient:
    createRawShaderAccessor<RadialGradientProps>('radialGradient'),
});
