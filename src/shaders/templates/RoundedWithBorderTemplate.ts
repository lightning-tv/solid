import type { ShaderProps } from '@lightningjs/renderer';
import { toValidVec4, type Vec4 } from '../utils.js';

export interface RoundedWithBorderProps {
  radius: Vec4;
  'border-w': Vec4;
  'border-color': number;
  'border-gap': number;
  'border-gapColor': number;
  'top-left': number;
  'top-right': number;
  'bottom-right': number;
  'bottom-left': number;
  'border-top': number;
  'border-right': number;
  'border-bottom': number;
  'border-left': number;
}

export const RoundedWithBorderTemplate = {
  props: {
    radius: {
      default: [0, 0, 0, 0],
      resolve(value) {
        return toValidVec4(value);
      },
    },
    'top-left': {
      default: 0,
      set(value, props) {
        (props.radius as Vec4)[0] = value;
      },
      get(props) {
        return (props.radius as Vec4)[0];
      },
    },
    'top-right': {
      default: 0,
      set(value, props) {
        (props.radius as Vec4)[1] = value;
      },
      get(props) {
        return (props.radius as Vec4)[1];
      },
    },
    'bottom-right': {
      default: 0,
      set(value, props) {
        (props.radius as Vec4)[2] = value;
      },
      get(props) {
        return (props.radius as Vec4)[2];
      },
    },
    'bottom-left': {
      default: 0,
      set(value, props) {
        (props.radius as Vec4)[3] = value;
      },
      get(props) {
        return (props.radius as Vec4)[3];
      },
    },
    'border-w': {
      default: [0, 0, 0, 0],
      resolve(value) {
        return toValidVec4(value);
      },
    },
    'border-color': 0xffffffff,
    'border-gap': 0,
    'border-gapColor': 0x00000000,
    'border-top': {
      default: 0,
      set(value, props) {
        (props['border-w'] as Vec4)[0] = value;
      },
      get(props) {
        return (props['border-w'] as Vec4)[0];
      },
    },
    'border-right': {
      default: 0,
      set(value, props) {
        (props['border-w'] as Vec4)[1] = value;
      },
      get(props) {
        return (props['border-w'] as Vec4)[1];
      },
    },
    'border-bottom': {
      default: 0,
      set(value, props) {
        (props['border-w'] as Vec4)[2] = value;
      },
      get(props) {
        return (props['border-w'] as Vec4)[2];
      },
    },
    'border-left': {
      default: 0,
      set(value, props) {
        (props['border-w'] as Vec4)[3] = value;
      },
      get(props) {
        return (props['border-w'] as Vec4)[3];
      },
    },
  } as ShaderProps<RoundedWithBorderProps>,
};
