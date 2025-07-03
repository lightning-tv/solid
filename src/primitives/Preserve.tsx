import * as s from 'solid-js'
import * as lng from '@lightningtv/solid'

function Preserve(props: lng.NodeProps): s.JSX.Element {

  let view = <view {...props} /> as any as lng.ElementNode

  view.preserve = true;

  view.onRender ??= () => {view.hidden = false}
  view.onRemove ??= () => {view.hidden = true}

  s.onCleanup(() => {view.destroy()})

  return view as any as s.JSX.Element
}

export default Preserve;
