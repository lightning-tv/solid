import { isInteger, type Styles } from '@lightningtv/core';
import { Accessor, createMemo } from 'solid-js';

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
  style1: T | undefined,
  style2: T | undefined,
): Accessor<T> {
  if (!style1) {
    return () => style2!;
  }

  if (!style2) {
    return () => style1;
  }

  return createMemo(() => ({
    ...style2,
    ...style1,
  }));
}
