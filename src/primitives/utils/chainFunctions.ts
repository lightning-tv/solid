type ChainableFunction = (...args: unknown[]) => unknown;

export function chainFunctions(...args: ChainableFunction[]): ChainableFunction;
export function chainFunctions<T>(...args: (ChainableFunction | T)[]): T;

// take an array of functions and if you return true from a function, it will stop the chain
export function chainFunctions<T extends ChainableFunction>(
  ...args: (ChainableFunction | T)[]
) {
  const onlyFunctions = args.filter((func) => typeof func === 'function');
  if (onlyFunctions.length === 0) {
    return undefined;
  }

  if (onlyFunctions.length === 1) {
    return onlyFunctions[0];
  }

  return function (this: unknown | T, ...innerArgs: unknown[]) {
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
