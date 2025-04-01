import {
  type ElementNode,
  type Styles,
  type ElementText,
  type TextNode,
} from '@lightningtv/core';
import { type JSX } from '@lightningtv/solid';
import { Accessor } from 'solid-js';
import { createRenderer } from 'solid-js/universal';

export type SolidRendererOptions = Parameters<
  typeof createRenderer<SolidNode>
>[0];

export interface RenderedNode extends ElementNode {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type SolidNode = ElementNode | ElementText | TextNode;

export type SolidStyles = Styles;

declare module '@lightningtv/core' {
  interface NodeProps {
    children?: JSX.Element | undefined;
  }

  interface TextProps {
    children?: string | string[] | undefined | null;
  }

  interface Config {
    taskDelay?: number;
  }
}

/**
 * A general `Component` has no implicit `children` prop.  If desired, you can
 * specify one as in `Component<{name: String, children: JSX.Element}>`.
 */
export type Component<P extends Record<string, any> = {}> = (
  props: P,
) => JSX.Element;

/**
 * Extend props to forbid the `children` prop.
 * Use this to prevent accidentally passing `children` to components that
 * would silently throw them away.
 */
export type VoidProps<P extends Record<string, any> = {}> = P & {
  children?: never;
};

/**
 * `VoidComponent` forbids the `children` prop.
 * Use this to prevent accidentally passing `children` to components that
 * would silently throw them away.
 */
export type VoidComponent<P extends Record<string, any> = {}> = Component<
  VoidProps<P>
>;

/**
 * Extend props to allow an optional `children` prop with the usual
 * type in JSX, `JSX.Element` (which allows elements, arrays, functions, etc.).
 * Use this for components that you want to accept children.
 */
export type ParentProps<P extends Record<string, any> = {}> = P & {
  children?: JSX.Element;
};

/**
 * `ParentComponent` allows an optional `children` prop with the usual
 * type in JSX, `JSX.Element` (which allows elements, arrays, functions, etc.).
 * Use this for components that you want to accept children.
 */
export type ParentComponent<P extends Record<string, any> = {}> = Component<
  ParentProps<P>
>;

/**
 * Extend props to require a `children` prop with the specified type.
 * Use this for components where you need a specific child type,
 * typically a function that receives specific argument types.
 * Note that all JSX <Elements> are of the type `JSX.Element`.
 */
export type FlowProps<
  P extends Record<string, any> = {},
  C = JSX.Element,
> = P & { children: C };

/**
 * `FlowComponent` requires a `children` prop with the specified type.
 * Use this for components where you need a specific child type,
 * typically a function that receives specific argument types.
 * Note that all JSX <Elements> are of the type `JSX.Element`.
 */
export type FlowComponent<
  P extends Record<string, any> = {},
  C = JSX.Element,
> = Component<FlowProps<P, C>>;

/** @deprecated: use `ParentProps` instead */
export type PropsWithChildren<P extends Record<string, any> = {}> =
  ParentProps<P>;

export type ValidComponent =
  | keyof JSX.IntrinsicElements
  | Component<any>
  | (string & {});

/**
 * Takes the props of the passed component and returns its type
 *
 * @example
 * ComponentProps<typeof Portal> // { mount?: Node; useShadow?: boolean; children: JSX.Element }
 * ComponentProps<'div'> // JSX.HTMLAttributes<HTMLDivElement>
 */
export type ComponentProps<T extends ValidComponent> =
  T extends Component<infer P>
    ? P
    : T extends keyof JSX.IntrinsicElements
      ? JSX.IntrinsicElements[T]
      : Record<string, unknown>;

/**
 * Type of `props.ref`, for use in `Component` or `props` typing.
 *
 * @example Component<{ref: Ref<Element>}>
 */
export type Ref<T> = T | ((val: T) => void);

export type ResolvedJSXElement = Exclude<JSX.Element, JSX.Element[]>;
export type ResolvedChildren = ResolvedJSXElement | ResolvedJSXElement[];
export type ChildrenReturn = Accessor<ResolvedChildren> & {
  toArray: () => ResolvedJSXElement[];
};

export type ContextProviderComponent<T> = FlowComponent<{ value: T }>;

// Context API
export interface Context<T> {
  id: symbol;
  Provider: ContextProviderComponent<T>;
  defaultValue: T;
}
