import { type IRendererTexture, renderer } from '@lightningtv/core';

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
): Record<string, IRendererTexture> {
  const spriteMapTexture = renderer.createTexture('ImageTexture', {
    src,
  });

  return subTextures.reduce<Record<string, IRendererTexture>>((acc, t) => {
    const { x, y, width, height } = t;
    acc[t.name] = renderer.createTexture('SubTexture', {
      texture: spriteMapTexture,
      x,
      y,
      width,
      height,
    });
    return acc;
  }, {});
}
