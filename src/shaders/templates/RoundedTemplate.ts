import type { ShaderProps } from '@lightningjs/renderer';
import { toValidVec4, type Vec4 } from '../utils.js';

export interface RoundedProps {
  radius: Vec4;
  'top-left': number;
  'top-right': number;
  'bottom-right': number;
  'bottom-left': number;
}

export const RoundedTemplate = {
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
  } as ShaderProps<RoundedProps>,
};
