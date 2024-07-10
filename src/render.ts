import { createRenderer } from 'solid-js/universal';
import {
  Config,
  type IntrinsicNodeProps,
  type IntrinsicTextProps,
  startLightningRenderer,
} from '@lightningtv/core';
import nodeOpts from './solidOpts.js';
import {
  splitProps,
  createMemo,
  untrack,
  type JSXElement,
  type ValidComponent,
} from 'solid-js';
import type { RendererMain } from '@lightningjs/renderer';
import { SolidNode } from './types.js';

const solidRenderer = createRenderer<SolidNode>(nodeOpts);

let renderer: RendererMain;
export const rootNode = nodeOpts.createElement('App');

export const render = async function (
  code: () => JSXElement,
  node?: HTMLElement | string,
) {
  renderer = startLightningRenderer(Config.rendererOptions, node || 'app');
  rootNode.lng = renderer.root!;
  rootNode.rendered = true;
  // @ts-expect-error - code is jsx element and not SolidElement yet
  return solidRenderer.render(code, rootNode);
};

export const {
  effect,
  memo,
  createComponent,
  createElement,
  createTextNode,
  insertNode,
  insert,
  spread,
  setProp,
  mergeProps,
  use,
} = solidRenderer;

/**
 * renders an arbitrary custom or native component and passes the other props
 * ```typescript
 * <Dynamic component={multiline() ? 'textarea' : 'input'} value={value()} />
 * ```
 * @description https://www.solidjs.com/docs/latest/api#dynamic
 */
export function Dynamic<T>(
  props: T & {
    component?: ValidComponent;
  },
): JSXElement {
  const [p, others] = splitProps(props, ['component']);

  const cached = createMemo(() => p.component);

  return createMemo(() => {
    const component = cached();
    switch (typeof component) {
      case 'function':
        return untrack(() => component(others));

      case 'string': {
        const el = createElement(component);
        spread(el, others);
        return el;
      }

      default:
        break;
    }
  }) as unknown as JSXElement;
}

// Dont use JSX as it creates circular dependencies and causes trouble with the playground.
export const View = (props: IntrinsicNodeProps) => {
  const el = createElement('node');
  spread(el, props, false);
  return el as unknown as JSXElement;
};

export const Text = (props: IntrinsicTextProps) => {
  const el = createElement('text');
  spread(el, props, false);
  return el as unknown as JSXElement;
};
