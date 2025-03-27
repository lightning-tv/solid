import { ElementNode, NodeProps, View  } from '@lightningtv/solid';
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

export default function FadeInOut(props: Props & NodeProps) {
  const config = Object.assign({}, DEFAULT_PROPS, props.transition);
  function onCreate(elm: ElementNode) {
    elm.alpha = 0;
    elm.animate({ alpha: 1 }, { duration: config.duration, easing: config.easing }).start();
  }

  function onDestroy(elm: ElementNode) {
    elm.rtt = true;
    return elm.animate({ alpha: 0 }, { duration: config.duration, easing: config.easing })
      .start().waitUntilStopped();
  }

  return (
    <Show when={props.when} keyed>
      <View {...props} onDestroy={onDestroy} onCreate={onCreate} />
    </Show>);
}
