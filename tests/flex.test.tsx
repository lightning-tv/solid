import * as v from 'vitest'
import * as s from 'solid-js'
import * as lng from '@lightningtv/solid'

import {renderer, waitForUpdate} from './setup.js'

v.test('Flex with swapping parents', async () => {

  const [condition, setCondition] = s.createSignal(true);

  const X = 100

  const one = () => <view width={X} height={X} />

  let aContainer!: lng.ElementNode
  let bContainer!: lng.ElementNode
  let aTwo!: lng.ElementNode
  let bTwo!: lng.ElementNode

  const dispose = renderer.render(() => <>
    <view ref={aContainer} display='flex'>
      {condition() && one()}
      <view ref={aTwo} width={X} height={X} />
    </view>
    <view ref={bContainer} display='flex' y={X}>
      {!condition() && one()}
      <view ref={bTwo} width={X} height={X} />
    </view>
  </>)

  await waitForUpdate();
  v.assert.equal(aTwo.width, X)
  v.assert.equal(aTwo.x, X)
  v.assert.equal(bTwo.x, 0)
  v.assert.equal(aContainer.width, X*2)
  v.assert.equal(bContainer.width, X)
  v.assert.equal(aContainer.height, X)
  v.assert.equal(bContainer.height, X)

  setCondition(false)

  await waitForUpdate();
  v.assert.equal(aTwo.x, 0)
  v.assert.equal(bTwo.x, X)
  v.assert.equal(aContainer.width, X)
  v.assert.equal(bContainer.width, X*2)
  v.assert.equal(aContainer.height, X)
  v.assert.equal(bContainer.height, X)

  setCondition(true)

  await waitForUpdate();
  v.assert.equal(aTwo.x, X)
  v.assert.equal(bTwo.x, 0)
  v.assert.equal(aContainer.width, X*2)
  v.assert.equal(bContainer.width, X)
  v.assert.equal(aContainer.height, X)
  v.assert.equal(bContainer.height, X)

  dispose()
})
