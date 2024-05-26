import type { ElementNode } from '@lightningtv/solid';
import { untrack } from 'solid-js';
import SpeechEngine, { type SeriesResult, type SpeechType } from './speech.js';
import { debounce } from '@solid-primitives/scheduled';
import { focusPath } from '../useFocusManager.js';

type DebounceWithFlushFunction<T> = {
  (newValue: T): void;
  flush(): void;
  clear: VoidFunction;
};

declare module '@lightningtv/solid' {
  /**
   * Augment the existing ElementNode interface with our own
   * Announcer-specific properties.
   */
  interface IntrinsicCommonProps {
    announce?: SpeechType;
    announceContext?: SpeechType;
    title?: SpeechType;
    loading?: boolean;
  }
}

let resetFocusPathTimer: DebounceWithFlushFunction<void>;
let prevFocusPath: ElementNode[] = [];
let currentlySpeaking: SeriesResult | undefined;
let voiceOutDisabled = false;
const fiveMinutes = 300000;

function debounceWithFlush<T>(
  callback: (newValue: T) => void,
  time?: number,
): DebounceWithFlushFunction<T> {
  const trigger = debounce(callback, time);
  let scopedValue: T;

  const debounced = (newValue: T) => {
    scopedValue = newValue;
    trigger(newValue);
  };

  debounced.flush = () => {
    trigger.clear();
    callback(scopedValue);
  };

  debounced.clear = trigger.clear;

  return debounced;
}

function getElmName(elm: ElementNode): string {
  return (elm.id || elm.name) as string;
}

function onFocusChangeCore(focusPath: ElementNode[] = []) {
  if (!Announcer.onFocusChange || !Announcer.enabled) {
    return;
  }

  const loaded = focusPath.every((elm) => !elm.loading);
  const focusDiff = focusPath.filter((elm) => !prevFocusPath.includes(elm));

  resetFocusPathTimer();

  if (!loaded && Announcer.onFocusChange) {
    Announcer.onFocusChange([]);
    return;
  }

  prevFocusPath = focusPath.slice(0);

  const toAnnounceText: SpeechType[] = [];
  const toAnnounce = focusDiff.reduce(
    (acc: [string, string, SpeechType][], elm) => {
      if (elm.announce) {
        acc.push([getElmName(elm), 'Announce', elm.announce]);
        toAnnounceText.push(elm.announce);
      } else if (elm.title) {
        acc.push([getElmName(elm), 'Title', elm.title]);
        toAnnounceText.push(elm.title);
      } else {
        acc.push([getElmName(elm), 'No Announce', '']);
      }
      return acc;
    },
    [],
  );

  focusDiff.reverse().reduce((acc, elm) => {
    if (elm.announceContext) {
      acc.push([getElmName(elm), 'Context', elm.announceContext]);
      toAnnounceText.push(elm.announceContext);
    } else {
      acc.push([getElmName(elm), 'No Context', '']);
    }
    return acc;
  }, toAnnounce);

  if (Announcer.debug) {
    console.table(toAnnounce);
  }

  if (toAnnounceText.length) {
    return Announcer.speak(
      toAnnounceText.reduce((acc: SpeechType[], val) => acc.concat(val), []),
    );
  }
}

function textToSpeech(toSpeak: SpeechType) {
  if (voiceOutDisabled) {
    return;
  }

  return (currentlySpeaking = SpeechEngine(toSpeak));
}

export interface Announcer {
  debug: boolean;
  enabled: boolean;
  cancel: VoidFunction;
  clearPrevFocus: (depth?: number) => void;
  speak: (
    text: SpeechType,
    options?: { append?: boolean; notification?: boolean },
  ) => SeriesResult;
  setupTimers: (options?: {
    focusDebounce?: number;
    focusChangeTimeout?: number;
  }) => void;
  onFocusChange?: DebounceWithFlushFunction<ElementNode[]>;
  refresh: (depth?: number) => void;
}

export const Announcer: Announcer = {
  debug: false,
  enabled: true,
  cancel: function () {
    currentlySpeaking && currentlySpeaking.cancel();
  },
  clearPrevFocus: function (depth = 0) {
    prevFocusPath = prevFocusPath.slice(0, depth);
    resetFocusPathTimer();
  },
  speak: function (text, { append = false, notification = false } = {}) {
    if (Announcer.onFocusChange && Announcer.enabled) {
      Announcer.onFocusChange.flush();
      if (append && currentlySpeaking && currentlySpeaking.active) {
        currentlySpeaking.append(text);
      } else {
        Announcer.cancel();
        textToSpeech(text);
      }

      if (notification) {
        voiceOutDisabled = true;
        currentlySpeaking?.series
          .finally(() => {
            voiceOutDisabled = false;
            Announcer.refresh();
          })
          .catch(console.error);
      }
    }

    return currentlySpeaking as SeriesResult;
  },
  refresh: function (depth = 0) {
    Announcer.clearPrevFocus(depth);
    Announcer.onFocusChange &&
      Announcer.onFocusChange(untrack(() => focusPath()));
  },
  setupTimers: function ({
    focusDebounce = 400,
    focusChangeTimeout = fiveMinutes,
  } = {}) {
    Announcer.onFocusChange = debounceWithFlush(
      onFocusChangeCore,
      focusDebounce,
    );

    resetFocusPathTimer = debounceWithFlush(() => {
      // Reset focus path for full announce
      prevFocusPath = [];
    }, focusChangeTimeout);
  },
};
