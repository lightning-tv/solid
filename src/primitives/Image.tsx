import { type Component, createRenderEffect, createSignal } from 'solid-js';
import { renderer, type NodeProps, type ImageTexture} from '@lightningtv/solid';
import { Config } from '../core/config.js';

export interface ImageProps extends NodeProps {
  src: string;
  /* image to load while src is being loaded */
  placeholder?: string;
  fallback?: string;
}

export const Image: Component<ImageProps> = (props) => {
  const [texture, setTexture] = createSignal<any>(null);
  const [src, setSrc] = createSignal<string | null>(props.placeholder || null);

  createRenderEffect(() => {
    if (Config.domRendererEnabled) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setSrc(props.src);
      };
      if (props.fallback) {
        img.onerror = () => {
          if (props.fallback === props.placeholder) {
            return;
          }
          setSrc(props.fallback!);
        };
      }
      img.src = props.src;
      return;
    }

    const srcTexture = renderer.createTexture('ImageTexture', props) as ImageTexture;

    if (props.fallback) {
      srcTexture.once('failed', () => {
        if (props.fallback === props.placeholder) {
          return;
        }
        setSrc(props.fallback!);
      });
    }

    srcTexture.getTextureData().then(resp => {
      // if texture fails to load, this is still called after the failed handler
      if (resp.data)
        setTexture(srcTexture);
    })
  })

  return (
    <view {...props} src={src()} color={props.color || 0xffffffff} texture={texture()} />
  );
};
