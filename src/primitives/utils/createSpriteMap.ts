import { type TextureMap, renderer } from '../../core/index.js';

export interface SpriteDef {
  name: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createSpriteMap(
  src: string,
  subTextures: SpriteDef[],
): Record<string, InstanceType<TextureMap['SubTexture']>> {
  const spriteMapTexture = renderer.createTexture('ImageTexture', {
    src,
  });

  return subTextures.reduce<
    Record<string, InstanceType<TextureMap['SubTexture']>>
  >((acc, t) => {
    const { x, y, width, height } = t;
    acc[t.name] = renderer.createTexture('SubTexture', {
      texture: spriteMapTexture,
      x,
      y,
      width,
      height,
    }) as InstanceType<TextureMap['SubTexture']>;
    return acc;
  }, {});
}
