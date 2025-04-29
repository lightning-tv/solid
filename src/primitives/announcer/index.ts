import { createEffect, on } from 'solid-js';
import { Announcer } from './announcer.js';
import { focusPath } from '../useFocusManager.js';

let doOnce = false;
export const useAnnouncer = (options?: {
  focusDebounce?: number;
  focusChangeTimeout?: number;
}) => {
  if (doOnce) {
    return Announcer;
  }
  doOnce = true;
  Announcer.setupTimers(options);
  createEffect(on(focusPath, Announcer.onFocusChange!, { defer: true }));

  return Announcer;
};

export { Announcer };
