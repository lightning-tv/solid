import * as s from 'solid-js'
import * as lng from '@lightningtv/solid'

interface Destroyable {
  (props: lng.NodeProps): s.JSX.Element;
  destroy: () => void;
}

export function createTag(children: s.JSX.Element): Destroyable {
  const [texture, setTexture] = s.createSignal<lng.Texture | null | undefined>(null);
  const Tag = <view
    display='flex'
    onLayout={(n) => {
      if (n.preFlexwidth && n.width !== n.preFlexwidth) {
        n.rtt = true;
        setTimeout(() => setTexture(n.texture), 1);
      }
    }}
    parent={lng.rootNode} children={children}
    textureOptions={{
    preventCleanup: true
  }} /> as any as lng.ElementNode
  Tag.render(false);

  const TagComponent = (props: lng.NodeProps) => {
    return <view color={0xffffffff} autosize {...props} texture={texture()} />;
  };
  TagComponent.destroy = () => Tag.destroy();

  return TagComponent;
}
