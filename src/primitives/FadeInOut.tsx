import { ElementNode, NodeProps, View } from '@lightningtv/solid';
import { Show } from 'solid-js';

interface Props {
  transition?: {
    duration?: number;
    easing?: string;
  };
  when?: boolean;
}

const DEFAULT_PROPS = {
  duration: 250,
  easing: 'ease-in-out',
};

export const ALPHA_NONE = { alpha: 0 };
export const ALPHA_FULL = { alpha: 1 };

export function fadeIn(el: ElementNode): void {
  if (!el?.lng?.animate) return;
  el.alpha = 0;
  el.animate(ALPHA_FULL).start();
}
export function fadeOut(el: ElementNode): Promise<void> {
  if (!el?.lng?.animate) return Promise.resolve();
  return el.animate(ALPHA_NONE).start().waitUntilStopped();
}

export default function FadeInOut(props: Props & NodeProps) {
  const config = Object.assign({}, DEFAULT_PROPS, props.transition);
  function onCreate(elm: ElementNode) {
    elm.alpha = 0;
    elm.animate({ alpha: 1 }, { duration: config.duration, easing: config.easing }).start();
  }

  function onDestroy(elm: ElementNode) {
    elm.rtt = true;
    return elm.animate({ alpha: 0 }, { duration: config.duration, easing: config.easing }).start().waitUntilStopped();
  }

  return (
    <Show when={props.when} keyed>
      <View {...props} onDestroy={onDestroy} onCreate={onCreate} />
    </Show>
  );
}
