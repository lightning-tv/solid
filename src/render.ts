import * as s from 'solid-js';
import * as lng from '@lightningtv/core';
import * as universal from './universal.js';
import { activeElement, setActiveElement } from './activeElement.js';

let renderer: lng.IRendererMain;
export const rootNode = universal.createElement('App');

const render = (code: () => s.JSX.Element): (() => void) => {
  return universal.render(code as any, rootNode);
};

export function createRenderer(
  rendererOptions?: lng.RendererMainSettings,
  node?: HTMLElement | string,
) {
  rendererOptions ??= lng.Config.rendererOptions as lng.RendererMainSettings;
  lng.assertTruthy(rendererOptions, 'Renderer options must be provided');

  renderer = lng.startLightningRenderer(rendererOptions, node);

  //Prevent this from happening automatically
  lng.Config.setActiveElement = setActiveElement;
  rootNode.lng = renderer.root!;
  rootNode.rendered = true;
  renderer.on('idle', () => {
    tasksEnabled = true;
    processTasks();
  });

  return {
    renderer,
    rootNode,
    render,
  };
}

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
} = universal;

type Task = () => void;
const taskQueue: Task[] = [];
let tasksEnabled = false;

s.createRoot(() => {
  s.createRenderEffect(() => {
    // should change whenever a keypress occurs, so we disable the task queue
    // until the renderer is idle again.
    activeElement();
    tasksEnabled = false;
  });
});

export function setTasksEnabled(enabled: boolean): void {
  tasksEnabled = enabled;
}

export function clearTasks(): void {
  taskQueue.length = 0;
}

export function scheduleTask(
  callback: Task,
  priority: 'high' | 'low' = 'low',
): void {
  if (priority === 'high') {
    taskQueue.unshift(callback);
  } else {
    taskQueue.push(callback);
  }
  processTasks();
}

function processTasks(): void {
  if (tasksEnabled && taskQueue.length) {
    setTimeout(() => {
      const task = taskQueue.shift();
      if (task) {
        task();
        processTasks();
      }
    }, lng.Config.taskDelay || 50);
  }
}

/**
 * renders an arbitrary custom or native component and passes the other props
 * ```typescript
 * <Dynamic component={multiline() ? 'textarea' : 'input'} value={value()} />
 * ```
 * @description https://www.solidjs.com/docs/latest/api#dynamic
 */
export function Dynamic<T extends Record<string, any>>(
  props: T & { component?: s.Component<T> | undefined | null },
): s.JSXElement {
  const [p, others] = s.splitProps(props, ['component']);

  const cached = s.createMemo(() => p.component);

  return s.createMemo(() => {
    const component = cached();
    switch (typeof component) {
      case 'function':
        return s.untrack(() => component(others));

      case 'string': {
        const el = createElement(component);
        spread(el, others);
        return el;
      }

      default:
        break;
    }
  }) as unknown as s.JSXElement;
}

// Dont use JSX as it creates circular dependencies and causes trouble with the playground.
export const View = (props: lng.NodeProps) => {
  const el = createElement('node');
  spread(el, props, false);
  return el as unknown as s.JSXElement;
};

export const Text = (props: lng.TextProps) => {
  const el = createElement('text');
  spread(el, props, false);
  return el as unknown as s.JSXElement;
};
