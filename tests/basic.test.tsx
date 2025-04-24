import * as v from 'vitest'
import * as lng from '@lightningtv/solid'

import {renderer} from './setup.js'

v.test('Basic test', () => {
  const dispose = renderer.render(() => <></>)
  v.assert.ok(renderer.rootNode instanceof lng.ElementNode)
  dispose()
})
