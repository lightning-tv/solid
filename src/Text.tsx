import { type Component } from 'solid-js';
import { type IntrinsicTextProps } from '@lightningtv/core';

export const Text: Component<IntrinsicTextProps> = (props) => (
  <text {...props}></text>
);
