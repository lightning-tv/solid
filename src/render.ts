/* eslint-disable @typescript-eslint/unbound-method */
import { createRenderer } from 'solid-js/universal';
import {
  Config,
  startLightningRenderer,
  type SolidNode,
} from '@lightningtv/core';
import nodeOpts from './solidOpts.js';
import {
  splitProps,
  createMemo,
  untrack,
  type JSXElement,
  type ValidComponent,
} from 'solid-js';
import type { RendererMain, RendererMainSettings } from '@lightningjs/renderer';

const solidRenderer = createRenderer<SolidNode>(nodeOpts);

let renderer: RendererMain;
export async function startLightning(
  options?: Partial<RendererMainSettings>,
  rootId?: string | HTMLElement,
) {
  renderer = startLightningRenderer(
    options || Config.rendererOptions,
    rootId || 'app',
  );
  return await renderer.init();
}

export const render = async function (
  code: () => JSXElement,
  node?: HTMLElement | string,
) {
  const rootNode = nodeOpts.createElement('App');

  await startLightning(undefined, node);
  rootNode.lng = renderer.root!;
  rootNode.rendered = true;
  // @ts-expect-error - code is jsx element and not SolidElement yet
  const dispose = solidRenderer.render(code, rootNode);
  return {
    dispose,
    rootNode,
    renderer,
  };
};

// used for playground - must be sync so user must await startLightning
export const renderSync = function (code: () => JSXElement) {
  const rootNode = nodeOpts.createElement('App');
  rootNode.lng = renderer.root!;
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
