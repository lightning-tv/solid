import { createSignal } from 'solid-js';
import { Config, type ElementNode } from '@lightningtv/core';
export const [activeElement, setActiveElement] = createSignal<
  ElementNode | undefined
>(undefined);

Config.setActiveElement = setActiveElement;
