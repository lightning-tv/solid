import * as s from 'solid-js';
import * as lng from '@lightningtv/core';
import { createRenderer as solidCreateRenderer } from 'solid-js/universal';
import { JSX } from '@lightningtv/solid/jsx-runtime';
import nodeOpts from './solidOpts.js';
import type {
  ChildrenReturn,
  Context,
  SolidNode,
  ValidComponent,
} from './types.js';
import { activeElement, setActiveElement } from './activeElement.js';

const solidRenderer = solidCreateRenderer<SolidNode>(nodeOpts);

let renderer: lng.RendererMain;
export const rootNode = nodeOpts.createElement('App');

const render = function (code: () => JSX.Element) {
  // @ts-expect-error - code is jsx element and not SolidElement yet
  return solidRenderer.render(code, rootNode);
};

export function createRenderer(
  rendererOptions?: lng.RendererMainSettings,
  node?: HTMLElement | string,
) {
  const options =
    rendererOptions || (lng.Config.rendererOptions as lng.RendererMainSettings);

  renderer = lng.startLightningRenderer(options, node || 'app') as any;
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
} = solidRenderer;

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
 * Resolves child elements to help interact with children
 *
 * @param fn an accessor for the children
 * @returns a accessor of the same children, but resolved
 *
 * @description https://docs.solidjs.com/reference/component-apis/children
 */
export const children = s.children as (
  fn: s.Accessor<JSX.Element>,
) => ChildrenReturn;

/**
 * Creates a Context to handle a state scoped for the children of a component
 * ```typescript
 * interface Context<T> {
 *   id: symbol;
 *   Provider: FlowComponent<{ value: T }>;
 *   defaultValue: T;
 * }
 * export function createContext<T>(
 *   defaultValue?: T,
 *   options?: { name?: string }
 * ): Context<T | undefined>;
 * ```
 * @param defaultValue optional default to inject into context
 * @param options allows to set a name in dev mode for debugging purposes
 * @returns The context that contains the Provider Component and that can be used with `useContext`
 *
 * @description https://docs.solidjs.com/reference/component-apis/create-context
 */
export const createContext = s.createContext as {
  <T>(
    defaultValue?: undefined,
    options?: s.EffectOptions,
  ): Context<T | undefined>;
  <T>(defaultValue: T, options?: s.EffectOptions): Context<T>;
};

/**
 * Uses a context to receive a scoped state from a parent's Context.Provider
 *
 * @param context Context object made by `createContext`
 * @returns the current or `defaultValue`, if present
 *
 * @description https://docs.solidjs.com/reference/component-apis/use-context
 */
export const useContext = s.useContext as <T>(context: Context<T>) => T;

/**
 * **[experimental]** Controls the order in which suspended content is rendered
 *
 * @description https://docs.solidjs.com/reference/components/suspense-list
 */
export const SuspenseList = s.SuspenseList as (props: {
  children: JSX.Element;
  revealOrder: 'forwards' | 'backwards' | 'together';
  tail?: 'collapsed' | 'hidden';
}) => JSX.Element;

/**
 * Tracks all resources inside a component and renders a fallback until they are all resolved
 * ```typescript
 * const AsyncComponent = lazy(() => import('./component'));
 *
 * <Suspense fallback={<LoadingIndicator />}>
 *   <AsyncComponent />
 * </Suspense>
 * ```
 * @description https://docs.solidjs.com/reference/components/suspense
 */
export const Suspense = s.Suspense as (props: {
  fallback?: JSX.Element;
  children: JSX.Element;
}) => JSX.Element;

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
): JSX.Element {
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
  }) as unknown as JSX.Element;
}

// Dont use JSX as it creates circular dependencies and causes trouble with the playground.
export const View = (props: lng.NodeProps) => {
  const el = createElement('node');
  spread(el, props, false);
  return el as unknown as JSX.Element;
};

export const Text = (props: lng.TextProps) => {
  const el = createElement('text');
  spread(el, props, false);
  return el as unknown as JSX.Element;
};

const narrowedError = (name: string) =>
  lng.isDev
    ? `Attempting to access a stale value from <${name}> that could possibly be undefined. This may occur because you are reading the accessor returned from the component at a time where it has already been unmounted. We recommend cleaning up any stale timers or async, or reading from the initial condition.`
    : `Stale read from <${name}>.`;

/**
 * Creates a list elements from a list
 *
 * it receives a map function as its child that receives a list element and an accessor with the index and returns a JSX-Element; if the list is empty, an optional fallback is returned:
 * ```typescript
 * <For each={items} fallback={<div>No items</div>}>
 *   {(item, index) => <div data-index={index()}>{item}</div>}
 * </For>
 * ```
 * If you have a list with fixed indices and changing values, consider using `<Index>` instead.
 *
 * @description https://docs.solidjs.com/reference/components/for
 */
export const For = s.For as <T extends readonly any[]>(props: {
  each: T | undefined | null | false;
  fallback?: JSX.Element;
  children: (item: T[number], index: s.Accessor<number>) => JSX.Element;
}) => JSX.Element;

/**
 * Non-keyed iteration over a list creating elements from its items
 *
 * To be used if you have a list with fixed indices, but changing values.
 * ```typescript
 * <Index each={items} fallback={<div>No items</div>}>
 *   {(item, index) => <div data-index={index}>{item()}</div>}
 * </Index>
 * ```
 * If you have a list with changing indices, better use `<For>`.
 *
 * @description https://docs.solidjs.com/reference/components/index
 */
export const Index = s.Index as <T extends readonly any[]>(props: {
  each: T | undefined | null | false;
  fallback?: JSX.Element;
  children: (item: s.Accessor<T[number]>, index: number) => JSX.Element;
}) => JSX.Element;

type RequiredParameter<T> = T extends () => unknown ? never : T;

/**
 * Conditionally render its children or an optional fallback component
 * @description https://docs.solidjs.com/reference/components/show
 */
export const Show = s.Show as {
  <
    T,
    TRenderFunction extends (item: s.Accessor<NonNullable<T>>) => JSX.Element,
  >(props: {
    when: T | undefined | null | false;
    keyed?: false;
    fallback?: JSX.Element;
    children: JSX.Element | RequiredParameter<TRenderFunction>;
  }): JSX.Element;
  <T, TRenderFunction extends (item: NonNullable<T>) => JSX.Element>(props: {
    when: T | undefined | null | false;
    keyed: true;
    fallback?: JSX.Element;
    children: JSX.Element | RequiredParameter<TRenderFunction>;
  }): JSX.Element;
};

/**
 * Switches between content based on mutually exclusive conditions
 * ```typescript
 * <Switch fallback={<FourOhFour />}>
 *   <Match when={state.route === 'home'}>
 *     <Home />
 *   </Match>
 *   <Match when={state.route === 'settings'}>
 *     <Settings />
 *   </Match>
 * </Switch>
 * ```
 * @description https://docs.solidjs.com/reference/components/switch-and-match
 */
export const Switch = s.Switch as (props: {
  fallback?: JSX.Element;
  children: JSX.Element;
}) => JSX.Element;

export type MatchProps<T> = {
  when: T | undefined | null | false;
  keyed?: boolean;
  children:
    | JSX.Element
    | ((item: NonNullable<T> | s.Accessor<NonNullable<T>>) => JSX.Element);
};
/**
 * Selects a content based on condition when inside a `<Switch>` control flow
 * ```typescript
 * <Match when={condition()}>
 *   <Content/>
 * </Match>
 * ```
 * @description https://docs.solidjs.com/reference/components/switch-and-match
 */
export const Match = s.Match as {
  <
    T,
    TRenderFunction extends (item: s.Accessor<NonNullable<T>>) => JSX.Element,
  >(props: {
    when: T | undefined | null | false;
    keyed?: false;
    children: JSX.Element | RequiredParameter<TRenderFunction>;
  }): JSX.Element;
  <T, TRenderFunction extends (item: NonNullable<T>) => JSX.Element>(props: {
    when: T | undefined | null | false;
    keyed: true;
    children: JSX.Element | RequiredParameter<TRenderFunction>;
  }): JSX.Element;
};

/**
 * Catches uncaught errors inside components and renders a fallback content
 *
 * Also supports a callback form that passes the error and a reset function:
 * ```typescript
 * <ErrorBoundary fallback={
 *   (err, reset) => <div onClick={reset}>Error: {err.toString()}</div>
 * }>
 *   <MyComp />
 * </ErrorBoundary>
 * ```
 * Errors thrown from the fallback can be caught by a parent ErrorBoundary
 *
 * @description https://docs.solidjs.com/reference/components/error-boundary
 */
export const ErrorBoundary = s.ErrorBoundary as (props: {
  fallback: JSX.Element | ((err: any, reset: () => void) => JSX.Element);
  children: JSX.Element;
}) => JSX.Element;
