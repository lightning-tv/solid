/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2023 Comcast Cable Communications Management, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Core Utility Functions
 *
 * @module
 */

export const EPSILON = 0.000001;
export let ARRAY_TYPE =
  typeof Float32Array !== 'undefined' ? Float32Array : Array;
export const RANDOM = Math.random;
export const ANGLE_ORDER = 'zyx';
const degree = Math.PI / 180;

export const setMatrixArrayType = (
  type: Float32ArrayConstructor | ArrayConstructor,
) => {
  ARRAY_TYPE = type;
};

/**
 * Merges two colors based on a given progress value.
 *
 * This function takes two colors (c1 and c2) represented as 32-bit integers
 * in RGBA format and blends them based on the provided progress value (p).
 * The result is a new color that is a weighted combination of the input colors,
 * where the weight is determined by the progress value.
 *
 * @param {number} c1 - The first color in RGBA format (32-bit integer).
 * @param {number} c2 - The second color in RGBA format (32-bit integer).
 * @param {number} p - The progress value between 0 and 1.
 * @returns {number} The merged color as a 32-bit integer in RGBA format.
 */
export function mergeColorProgress(
  rgba1: number,
  rgba2: number,
  p: number,
): number {
  const r1 = Math.trunc(rgba1 >>> 24);
  const g1 = Math.trunc((rgba1 >>> 16) & 0xff);
  const b1 = Math.trunc((rgba1 >>> 8) & 0xff);
  const a1 = Math.trunc(rgba1 & 0xff);

  const r2 = Math.trunc(rgba2 >>> 24);
  const g2 = Math.trunc((rgba2 >>> 16) & 0xff);
  const b2 = Math.trunc((rgba2 >>> 8) & 0xff);
  const a2 = Math.trunc(rgba2 & 0xff);

  const r = Math.round(r2 * p + r1 * (1 - p));
  const g = Math.round(g2 * p + g1 * (1 - p));
  const b = Math.round(b2 * p + b1 * (1 - p));
  const a = Math.round(a2 * p + a1 * (1 - p));

  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

export const toRadian = (a: number) => {
  return a * degree;
};

export const equals = (a: number, b: number) => {
  return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
};

export const rand = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const isPowerOfTwo = (value: number) => {
  return value && !(value & (value - 1));
};

const getTimingBezier = (
  a: number,
  b: number,
  c: number,
  d: number,
): ((time: number) => number | undefined) => {
  const xc = 3.0 * a;
  const xb = 3.0 * (c - a) - xc;
  const xa = 1.0 - xc - xb;
  const yc = 3.0 * b;
  const yb = 3.0 * (d - b) - yc;
  const ya = 1.0 - yc - yb;

  return function (time: number): number | undefined {
    if (time >= 1.0) {
      return 1;
    }
    if (time <= 0) {
      return 0;
    }

    let t = 0.5,
      cbx,
      cbxd,
      dx;

    for (let it = 0; it < 20; it++) {
      cbx = t * (t * (t * xa + xb) + xc);
      dx = time - cbx;
      if (dx > -1e-8 && dx < 1e-8) {
        return t * (t * (t * ya + yb) + yc);
      }

      // Cubic bezier derivative.
      cbxd = t * (t * (3 * xa) + 2 * xb) + xc;

      if (cbxd > 1e-10 && cbxd < 1e-10) {
        // Problematic. Fall back to binary search method.
        break;
      }

      t += dx / cbxd;
    }

    // Fallback: binary search method. This is more reliable when there are near-0 slopes.
    let minT = 0;
    let maxT = 1;
    for (let it = 0; it < 20; it++) {
      t = 0.5 * (minT + maxT);

      cbx = t * (t * (t * xa + xb) + xc);

      dx = time - cbx;
      if (dx > -1e-8 && dx < 1e-8) {
        // Solution found!
        return t * (t * (t * ya + yb) + yc);
      }

      if (dx < 0) {
        maxT = t;
      } else {
        minT = t;
      }
    }
  };
};

interface TimingFunctionMap {
  [key: string]: (time: number) => number | undefined;
}

type TimingLookupArray = number[];
interface TimingLookup {
  [key: string]: TimingLookupArray;
}

const timingMapping: TimingFunctionMap = {};

const timingLookup: TimingLookup = {
  ease: [0.25, 0.1, 0.25, 1.0],
  'ease-in': [0.42, 0, 1.0, 1.0],
  'ease-out': [0, 0, 0.58, 1.0],
  'ease-in-out': [0.42, 0, 0.58, 1.0],
  'ease-in-sine': [0.12, 0, 0.39, 0],
  'ease-out-sine': [0.12, 0, 0.39, 0],
  'ease-in-out-sine': [0.37, 0, 0.63, 1],
  'ease-in-cubic': [0.32, 0, 0.67, 0],
  'ease-out-cubic': [0.33, 1, 0.68, 1],
  'ease-in-out-cubic': [0.65, 0, 0.35, 1],
  'ease-in-circ': [0.55, 0, 1, 0.45],
  'ease-out-circ': [0, 0.55, 0.45, 1],
  'ease-in-out-circ': [0.85, 0, 0.15, 1],
  'ease-in-back': [0.36, 0, 0.66, -0.56],
  'ease-out-back': [0.34, 1.56, 0.64, 1],
  'ease-in-out-back': [0.68, -0.6, 0.32, 1.6],
};

const defaultTiming = (t: number): number => t;

const parseCubicBezier = (str: string) => {
  //cubic-bezier(0.84, 0.52, 0.56, 0.6)
  const regex = /-?\d*\.?\d+/g;
  const match = str.match(regex);

  if (match) {
    const [num1, num2, num3, num4] = match;
    const a = parseFloat(num1 || '0.42');
    const b = parseFloat(num2 || '0');
    const c = parseFloat(num3 || '1');
    const d = parseFloat(num4 || '1');

    const timing = getTimingBezier(a, b, c, d);
    timingMapping[str] = timing;

    return timing;
  }

  // parse failed, return linear
  console.warn('Unknown cubic-bezier timing: ' + str);
  return defaultTiming;
};

export const getTimingFunction = (
  str: string,
): ((time: number) => number | undefined) => {
  if (str === 'linear') {
    return defaultTiming;
  }

  if (timingMapping[str] !== undefined) {
    return timingMapping[str] || defaultTiming;
  }

  if (str === 'step-start') {
    return () => {
      return 1;
    };
  }

  if (str === 'step-end') {
    return (time: number) => {
      return time === 1 ? 1 : 0;
    };
  }

  const lookup = timingLookup[str];
  if (lookup !== undefined) {
    const [a, b, c, d] = lookup;
    // @ts-ignore - TS doesn't understand that we've checked for undefined
    const timing = getTimingBezier(a, b, c, d);
    timingMapping[str] = timing;
    return timing;
  }

  if (str.startsWith('cubic-bezier')) {
    return parseCubicBezier(str);
  }

  console.warn('Unknown timing function: ' + str);
  return defaultTiming;
};

/**
 * Convert bytes to string of megabytes with 2 decimal points
 *
 * @param bytes
 * @returns
 */
export function bytesToMb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(2);
}
