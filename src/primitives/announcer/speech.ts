type CoreSpeechType =
  | string
  | (() => SpeechType)
  | SpeechType[]
  | SpeechSynthesisUtterance;
export type SpeechType = CoreSpeechType | Promise<CoreSpeechType>;

export interface SeriesResult {
  series: Promise<void>;
  readonly active: boolean;
  append: (toSpeak: SpeechType) => void;
  cancel: () => void;
}

// Aria label
type AriaLabel = { text: string; lang: string };
const ARIA_PARENT_ID = 'aria-parent';
let ariaLabelPhrases: AriaLabel[] = [];

/* global SpeechSynthesisErrorEvent */
function flattenStrings(series: SpeechType[] = []): SpeechType[] {
  const flattenedSeries = [];

  let i;
  for (i = 0; i < series.length; i++) {
    const s = series[i];
    if (typeof s === 'string' && !s.includes('PAUSE-')) {
      flattenedSeries.push(series[i]);
    } else {
      break;
    }
  }
  // add a "word boundary" to ensure the Announcer doesn't automatically try to
  // interpret strings that look like dates but are not actually dates
  // for example, if "Rising Sun" and "1993" are meant to be two separate lines,
  // when read together, "Sun 1993" is interpretted as "Sunday 1993"
  return ([flattenedSeries.join(',\b ')] as SpeechType[]).concat(
    series.slice(i),
  );
}

function delay(pause: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, pause);
  });
}

/**
 * @description This function is called at the end of the speak series, since we have recusion possible, we need a signal to add all the phrases
 * @param Phrase is an object containing the text and the language
 */
function addChildrenToAriaDiv(phrase: AriaLabel) {
  if (phrase && phrase.text && phrase.text.trim().length === 0) return;
  ariaLabelPhrases.push(phrase);
}

/**
 * @description This function is triggered finally when the speak series is finished and we are to speak the aria labels
 */
function focusElementForAria() {
  const element = createAriaElement();

  if (!element) {
    console.error(`ARIA div not found: ${ARIA_PARENT_ID}`);
    return;
  }

  for (const object of ariaLabelPhrases) {
    const span = document.createElement('span');

    // TODO: Not sure LG or Samsung support lang attribute on span or switching language
    span.setAttribute('lang', object.lang);
    span.setAttribute('aria-label', object.text);
    element.appendChild(span);
  }

  // Cleanup
  setTimeout(() => {
    ariaLabelPhrases = [];
    cleanAriaLabelParent();
    focusCanvas();
  }, 100);
}

/**
 * @description Clean the aria label parent after speaking
 */
function cleanAriaLabelParent(): void {
  const parentTag = document.getElementById(ARIA_PARENT_ID);
  if (parentTag) {
    while (parentTag.firstChild) {
      parentTag.removeChild(parentTag.firstChild);
    }
  }
}

/**
 * @description Focus the canvas element
 */
function focusCanvas(): void {
  const canvas = document.getElementById('app')?.firstChild as HTMLElement;
  canvas?.focus();
}

/**
 * @description Create the aria element in the DOM if it doesn't exist
 * @private For xbox, we may need to create a different element each time we wanna use aria
 */
function createAriaElement(): HTMLDivElement | HTMLElement {
  const aria_container = document.getElementById(ARIA_PARENT_ID);

  if (!aria_container) {
    const element = document.createElement('div');
    element.setAttribute('id', ARIA_PARENT_ID);
    element.setAttribute('aria-live', 'assertive');
    element.setAttribute('tabindex', '0');
    document.body.appendChild(element);
    return element;
  }

  return aria_container;
}

/**
 * Speak a string
 *
 * @param phrase Phrase to speak
 * @param utterances An array which the new SpeechSynthesisUtterance instance representing this utterance will be appended
 * @param lang Language to speak in
 * @return {Promise<void>} Promise resolved when the utterance has finished speaking, and rejected if there's an error
 */
function speak(
  phrase: string,
  utterances: SpeechSynthesisUtterance[],
  lang = 'en-US',
  voiceName?: string,
) {
  const synth = window.speechSynthesis;

  return new Promise<void>((resolve, reject) => {
    let selectedVoice;
    if (voiceName) {
      const availableVoices = synth.getVoices();
      selectedVoice =
        availableVoices.find((v) => v.name === voiceName) || availableVoices[0];
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = lang;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.onend = () => {
      resolve();
    };
    utterance.onerror = (e) => {
      reject(e);
    };
    utterances.push(utterance);
    synth.speak(utterance);
  });
}

function speakSeries(
  series: SpeechType,
  aria: boolean,
  lang: string,
  voice?: string,
  root = true,
): SeriesResult {
  const synth = window.speechSynthesis;
  const remainingPhrases = flattenStrings(
    Array.isArray(series) ? series : [series],
  );
  const nestedSeriesResults: SeriesResult[] = [];
  const utterances: SpeechSynthesisUtterance[] = [];
  let active: boolean = true;

  const seriesChain = (async () => {
    try {
      while (active && remainingPhrases.length) {
        const phrase = await Promise.resolve(remainingPhrases.shift());
        if (!active) {
          break; // Exit if canceled
        }

        if (typeof phrase === 'string' && phrase.includes('PAUSE-')) {
          // Handle pauses
          const pause = Number(phrase.split('PAUSE-')[1]) * 1000;
          if (!isNaN(pause)) {
            await delay(pause);
          }
        } else if (typeof phrase === 'string') {
          if (!phrase) {
            continue; // Skip empty strings
          }
          // Handle regular strings with retry logic
          const totalRetries = 3;
          let retriesLeft = totalRetries;

          while (active && retriesLeft > 0) {
            try {
              if (aria) addChildrenToAriaDiv({ text: phrase, lang });
              else await speak(phrase, utterances, lang, voice);
              retriesLeft = 0; // Exit retry loop on success
            } catch (e) {
              if (e instanceof SpeechSynthesisErrorEvent) {
                if (e.error === 'network') {
                  retriesLeft--;
                  console.warn(
                    `Speech synthesis network error. Retries left: ${retriesLeft}`,
                  );
                  await delay(500 * (totalRetries - retriesLeft));
                } else if (
                  e.error === 'canceled' ||
                  e.error === 'interrupted'
                ) {
                  // Cancel or interrupt error (ignore)
                  retriesLeft = 0;
                } else {
                  throw new Error(`SpeechSynthesisErrorEvent: ${e.error}`);
                }
              } else {
                throw e;
              }
            }
          }
        } else if (phrase instanceof SpeechSynthesisUtterance) {
          // Handle SpeechSynthesisUtterance objects with retry logic
          const totalRetries = 3;
          let retriesLeft = totalRetries;
          const text = phrase.text;
          const objectLang = phrase?.lang;
          const objectVoice = phrase?.voice;

          while (active && retriesLeft > 0) {
            try {
              if (text) {
                if (aria) addChildrenToAriaDiv({ text, lang: objectLang });
                else
                  await speak(text, utterances, objectLang, objectVoice?.name);
                retriesLeft = 0; // Exit retry loop on success
              }
            } catch (e) {
              if (e instanceof SpeechSynthesisErrorEvent) {
                if (e.error === 'network') {
                  retriesLeft--;
                  console.warn(
                    `Speech synthesis network error. Retries left: ${retriesLeft}`,
                  );
                  await delay(500 * (totalRetries - retriesLeft));
                } else if (
                  e.error === 'canceled' ||
                  e.error === 'interrupted'
                ) {
                  // Cancel or interrupt error (ignore)
                  retriesLeft = 0;
                } else {
                  throw new Error(`SpeechSynthesisErrorEvent: ${e.error}`);
                }
              } else {
                throw e;
              }
            }
          }
        } else if (typeof phrase === 'function') {
          // Handle functions
          const seriesResult = speakSeries(phrase(), aria, lang, voice, false);
          nestedSeriesResults.push(seriesResult);
          await seriesResult.series;
        } else if (Array.isArray(phrase)) {
          // Handle nested arrays
          const seriesResult = speakSeries(phrase, aria, lang, voice, false);
          nestedSeriesResults.push(seriesResult);
          await seriesResult.series;
        }
      }
    } finally {
      active = false;
      // Call completion logic only for the original (root) series
      if (root && aria) {
        focusElementForAria();
      }
    }
  })();

  return {
    series: seriesChain,
    get active() {
      return active;
    },
    append: (toSpeak: SpeechType) => {
      remainingPhrases.push(toSpeak);
    },
    cancel: () => {
      if (!active) {
        return;
      }

      if (root) {
        if (aria) {
          const element = createAriaElement();

          if (element) {
            ariaLabelPhrases = [];
            cleanAriaLabelParent();
            element.focus();
            focusCanvas();
          }

          return;
        }

        synth.cancel(); // Cancel all ongoing speech
      }
      nestedSeriesResults.forEach((nestedSeriesResult) => {
        nestedSeriesResult.cancel();
      });
      active = false;
    },
  };
}

let currentSeries: SeriesResult | undefined;
export default function (
  toSpeak: SpeechType,
  aria: boolean,
  lang: string = 'en-US',
  voice?: string,
) {
  currentSeries && currentSeries.cancel();
  currentSeries = speakSeries(toSpeak, aria, lang, voice);
  return currentSeries;
}
