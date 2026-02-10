import {
  ElementNode,
  insertNode,
  type NodeProps,
  type NodeStyles,
} from '@lightningtv/solid';
import {
  createMemo,
  getOwner,
  onMount,
  runWithOwner,
  type Accessor,
} from 'solid-js';
import { fadeIn, fadeOut } from './FadeInOut.jsx';
import { chainFunctions } from '@lightningtv/solid/primitives';

export const BorderBoxStyle: NodeStyles = {
  alpha: 0,
  borderSpace: 6,
  borderRadius: 20,
  border: { color: 0xffffff, width: 2 },
};

type BorderProps = NodeProps & { borderSpace?: number };
const borderComponent = (props: BorderProps) => {
  const space = createMemo(
    () => props.borderSpace ?? (BorderBoxStyle.borderSpace as number),
  );
  return (
    <view
      skipFocus
      onCreate={(el) => {
        const parent = el.parent!;
        el.width = parent.width + space() * 2;
        el.height = parent.height + space() * 2;
        fadeIn(el);
      }}
      onDestroy={fadeOut}
      style={BorderBoxStyle}
      x={-space()}
      y={-space()}
      {...props}
    />
  );
};

// Solid directives can only be used on native root elements `view` and `text`
export function borderBox(
  el: ElementNode,
  accessor: Accessor<BorderProps | true | undefined>,
) {
  let border: ElementNode | null;
  const owner = getOwner();

  onMount(() => {
    el.onFocusChanged = chainFunctions((f) => {
      if (f) {
        if (border) return;
        runWithOwner(owner, () => {
          const props = accessor();
          border = borderComponent(
            props === true || props === undefined ? ({} as NodeProps) : props,
          ) as any as ElementNode;
          insertNode(el, border);
          border.render();
        });
      } else if (border) {
        border.destroy();
        el.removeChild(border!);
        border = null;
      }
    }, el.onFocusChanged);
  });
}
