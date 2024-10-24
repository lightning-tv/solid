import { isInteger, isArray, type Styles } from '@lightningtv/core';
import { createMemo, untrack } from 'solid-js';

/**
 * Converts a color string to a color number value.
 */
export function hexColor(color: string | number = ''): number {
  if (isInteger(color)) {
    return color;
  }

  if (typeof color === 'string') {
    // Renderer expects RGBA values
    if (color.startsWith('#')) {
      return Number(
        color.replace('#', '0x') + (color.length === 7 ? 'ff' : ''),
      );
    }

    if (color.startsWith('0x')) {
      return Number(color);
    }
    return Number('0x' + (color.length === 6 ? color + 'ff' : color));
  }

  return 0x00000000;
}

export function combineStyles<T extends Styles>(
  ...styles: (T | undefined)[]
): T {
  return untrack(() => flattenStyles(styles));
}

export function combineStylesReactive<T extends Styles>(
  ...styles: (T | undefined)[]
): T {
  return createMemo(() => flattenStyles(styles))();
}

function flattenStyles<T extends Styles>(
  obj: T | undefined | (T | undefined)[],
  result: T = {} as T,
): T {
  if (isArray(obj)) {
    obj.forEach((item) => {
      flattenStyles(item, result);
    });
  } else if (obj) {
    // handle the case where the object is not an array
    for (const key in obj) {
      // be careful of 0 values
      if (result[key] === undefined) {
        result[key as keyof Styles] = obj[key as keyof Styles]!;
      }
    }
  }

  return result;
}
