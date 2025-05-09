import * as v from 'vitest'
import * as s from 'solid-js'
import * as lng from '@lightningtv/solid'

import {renderer} from './setup.js'

v.test('Basic test', () => {
  const dispose = renderer.render(() => <></>)
  v.assert.ok(renderer.rootNode instanceof lng.ElementNode)
  dispose()
})

v.test('Update text', () => {

  const [count, setCount] = s.createSignal(0)

  const dispose = renderer.render(() => <>
    <view>
      <text>Count is {''+count()}!</text>
    </view>
  </>)

  v.assert.equal(renderer.rootNode.children[0]!.children[0]!.text, 'Count is 0!')

  setCount(1)
  v.assert.equal(renderer.rootNode.children[0]!.children[0]!.text, 'Count is 1!')

  setCount(2)
  v.assert.equal(renderer.rootNode.children[0]!.children[0]!.text, 'Count is 2!')

  dispose()
})
