import { createSignal } from 'solid-js';
import { type ElementNode } from '@lightningtv/core';
export const [activeElement, setActiveElement] = createSignal<
  ElementNode | undefined
>(undefined);
