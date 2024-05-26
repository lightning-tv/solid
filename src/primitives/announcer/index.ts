import { createEffect, on } from 'solid-js';
import { Announcer } from './announcer.js';
import { focusPath } from '../useFocusManager.js';

export const useAnnouncer = () => {
  Announcer.setupTimers();
  createEffect(on(focusPath, Announcer.onFocusChange!, { defer: true }));

  return Announcer;
};
