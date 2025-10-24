import { type Component, createRenderEffect, createSignal } from 'solid-js';
import { renderer, type NodeProps, type ImageTexture} from '@lightningtv/solid';
export interface ImageProps extends NodeProps {
  src: string;
  /* image to load while src is being loaded */
  placeholder?: string;
  fallback?: string;
}

export const Image: Component<ImageProps> = (props) => {
  const [texture, setTexture] = createSignal<any>(null);

  createRenderEffect(() => {
    if (props.placeholder) {
      setTexture(renderer.createTexture('ImageTexture', {
        src: props.placeholder
      }));
    }

    const src = renderer.createTexture('ImageTexture', {
      src: props.src
    }) as ImageTexture;

    src.once('loaded', () => {
      setTexture(src);
    });

    if (props.fallback) {
      src.once('failed', () => {
        if (props.fallback === props.placeholder) {
          return;
        }
        const src = renderer.createTexture('ImageTexture', {
          src: props.fallback
        });
        setTexture(src);
      });
    }
  })

  return (
    <view {...props} src={null} color={props.color || 0xffffffff} texture={texture()} />
  );
};
