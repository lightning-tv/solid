import * as lng from '@lightningtv/solid';

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

// @ts-expect-error
document.fonts = {
  add: () => {},
  delete: () => {},
  check: () => true,
  load: () => Promise.resolve(),
  forEach: () => {},
  ready: Promise.resolve(),
};

export const renderer = lng.createRenderer(undefined, root);
