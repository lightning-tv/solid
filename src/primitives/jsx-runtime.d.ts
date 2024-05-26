import 'solid-js';
import type { withPaddingInput } from './withPadding.ts';

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      model: [() => any, (v: any) => any];
      withPadding: withPaddingInput;
    }
  }
}
