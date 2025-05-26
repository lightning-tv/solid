import * as s from 'solid-js';

export type AnyFunction = (this: any, ...args: any[]) => any;

/**
 * take an array of functions and if you return `true` from a function, it will stop the chain
 * @param fns list of functions to chain together, can be `undefined`, `null`, or `false` to skip them
 * @returns a function that will call each function in the list until one returns `true` or all functions are called.
 * If no functions are provided, it will return `undefined`.
 *
 * @example
 * ```tsx
 * function Button (props: NodeProps) {
 *   function onEnter (el: ElementNode) {...}
 *   return <view onEnter={chainFunctions(props.onEnter, onEnter)} />
 * }
 * ```
 */
export function chainFunctions<T extends AnyFunction>(...fns: T[]): T;
export function chainFunctions<T extends AnyFunction>(
  ...fns: (T | undefined | null | false)[]
): T | undefined;
export function chainFunctions(
  ...fns: (AnyFunction | undefined | null | false)[]
): AnyFunction | undefined {
  const onlyFunctions = fns.filter((func) => typeof func === 'function');
  if (onlyFunctions.length === 0) {
    return undefined;
  }

  if (onlyFunctions.length === 1) {
    return onlyFunctions[0];
  }

  return function (...innerArgs) {
    let result;
    for (const func of onlyFunctions) {
      result = func.apply(this, innerArgs);
      if (result === true) {
        return result;
      }
    }
    return result;
  };
}

/**
 * Utility for chaining multiple `ref` assignments with `props.ref` forwarding.
 * @param refs list of ref setters. Can be a `props.ref` prop for ref forwarding or a setter to a local variable (`el => ref = el`).
 * @example
 * ```tsx
 * function Button (props: NodeProps) {
 *    let localRef: ElementNode | undefined
 *    return <view ref={chainRefs(props.ref, el => localRef = el)} />
 * }
 * ```
 */
export const chainRefs = chainFunctions as <T>(
  ...refs: (s.Ref<T> | undefined)[]
) => (el: T) => void;
