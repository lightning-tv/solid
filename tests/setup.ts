import * as lng from '@lightningtv/solid';
import * as v from 'vitest';
import {
  WebGlCoreRenderer,
  SdfTextRenderer,
} from '@lightningjs/renderer/webgl';
import { CanvasTextRenderer } from '@lightningjs/renderer/canvas';

lng.Config.rendererOptions = {
  fontEngines: [CanvasTextRenderer],
  renderEngine: WebGlCoreRenderer,
};

globalThis.ResizeObserver = class MockResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

globalThis.MutationObserver = class MockMutationObserver {
  constructor() {}
  observe() {}
  disconnect() {}
} as any;

export const root = document.createElement('div');
document.body.appendChild(root);

if (!document.fonts) {
  // @ts-expect-error @ts-ignore
  document.fonts = {
    add: () => {},
    delete: () => {},
    check: () => true,
    load: () => Promise.resolve(),
    forEach: () => {},
    ready: Promise.resolve(),
  };
}

export const renderer = lng.createRenderer(undefined, root);

export const waitForUpdate = () => {
  return v.vi.waitFor(() => {
    var toReturn = false;
    setTimeout(() => {
      toReturn = true;
    }, 1);
    return toReturn;
  }, 1);
};
