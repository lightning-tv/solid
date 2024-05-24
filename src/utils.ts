import { isInteger } from '@lightningtv/core';

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

/**
 * Converts degrees to radians
 */
export function deg2rad(deg: number) {
  return (deg * Math.PI) / 180;
}
