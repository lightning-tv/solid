import { renderer } from '@lightningtv/solid';
import type { SpecificTextureRef } from '@lightningjs/renderer';

export interface SpriteDef {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createSpriteMap(src: string, subTextures: SpriteDef[]) {
  const spriteMapTexture = renderer.createTexture('ImageTexture', {
    src,
  });

  return subTextures.reduce<Record<string, SpecificTextureRef<'SubTexture'>>>(
    (acc, t) => {
      const { x, y, width, height } = t;
      acc[t.name] = renderer.createTexture('SubTexture', {
        texture: spriteMapTexture,
        x,
        y,
        width,
        height,
      });
      return acc;
    },
    {},
  );
}
