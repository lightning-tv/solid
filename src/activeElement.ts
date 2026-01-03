import { createSignal } from 'solid-js';
import { type ElementNode } from './core/index.js';
export const [activeElement, setActiveElement] = createSignal<
  ElementNode | undefined
>(undefined);
