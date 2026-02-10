import {
  ElementNode,
  insertNode,
  type NodeProps,
  type NodeStyles,
} from '@lightningtv/solid';
import { getOwner, runWithOwner, type Accessor } from 'solid-js';
import { fadeIn, fadeOut } from './FadeInOut.jsx';
import { chainFunctions } from '@lightningtv/solid/primitives';

export const BorderBoxStyle: NodeStyles = {
  alpha: 0.01,
  borderSpace: 6,
  borderRadius: 20,
  border: { color: 0xffffff, width: 2 },
  scale: 1,
};

type BorderProps = NodeProps & { borderSpace?: number };
const borderComponent = (props: BorderProps) => {
  const space = props.borderSpace ?? (BorderBoxStyle.borderSpace as number);
  const scale = props.scale ?? (BorderBoxStyle.scale as number);
  return (
    <view
      skipFocus
      onCreate={(el) => {
        const parent = el.parent!;
        el.width = parent.width * scale + space * 2;
        el.height = parent.height * scale + space * 2;
        fadeIn(el);
      }}
      onDestroy={fadeOut}
      style={BorderBoxStyle}
      x={-space}
      y={-space}
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
}
