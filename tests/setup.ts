import * as lng from '@lightningtv/solid';

lng.Config.domRendering = true;
lng.Config.rendererOptions = {};

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

export const renderer = lng.createRenderer(undefined, root);
