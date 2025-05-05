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
          // Handle regular strings with retry logic
          const totalRetries = 3;
          let retriesLeft = totalRetries;

          while (active && retriesLeft > 0) {
            try {
              await speak(phrase, utterances, lang, voice);
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

          while (active && retriesLeft > 0) {
            try {
              // Wait for the utterance to finish
              await new Promise<void>((resolve, reject) => {
                phrase.onend = () => resolve();
                phrase.onerror = (e) => reject(e);

                utterances.push(phrase);
                synth.speak(phrase);
              });

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
        } else if (typeof phrase === 'function') {
          // Handle functions
          const seriesResult = speakSeries(phrase(), lang, voice, false);
          nestedSeriesResults.push(seriesResult);
          await seriesResult.series;
        } else if (Array.isArray(phrase)) {
          // Handle nested arrays
          const seriesResult = speakSeries(phrase, lang, voice, false);
          nestedSeriesResults.push(seriesResult);
          await seriesResult.series;
        }
      }
    } finally {
      active = false;
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
  lang: string = 'en-US',
  voice?: string,
) {
  currentSeries && currentSeries.cancel();
  currentSeries = speakSeries(toSpeak, lang, voice);
  return currentSeries;
}
