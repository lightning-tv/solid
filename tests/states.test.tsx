import * as v from 'vitest';
import * as s from 'solid-js';
import * as lng from '@lightningtv/solid';
import { renderer, waitForUpdate } from './setup.js';

v.describe('State Specificity', () => {
  v.test('Applies states in the order defined by Config.stateOrder', async () => {
    // Save original mapper
    const originalOrder = lng.Config.stateOrder;

    // Define mapper: $active has lower specificity than $focus
    lng.Config.stateOrder = ['$active', '$focus'];

    let node!: lng.ElementNode;

    const dispose = renderer.render(() => (
      <view
        ref={node}
        color={0xff0000ff} // default red
        states={['$focus', '$active']} // passed in reverse order to ensure sorting works
        $active={{
          color: 0x00ff00ff, // green
          scale: 1.5,
          alpha: 0.5,
        }}
        $focus={{
          color: 0x0000ffff, // blue
          scale: 2.0,
        }}
      />
    ));

    await waitForUpdate();

    // Since $focus is after $active in stateOrder, $focus should win where properties collide
    v.assert.equal(node.color, 0x0000ffff);
    v.assert.equal(node.scale, 2.0);
    // alpha is only in $active, so it should still apply
    v.assert.equal(node.alpha, 0.5);

    dispose();

    // Restore original mapper
    lng.Config.stateOrder = originalOrder;
  });

  v.test('Unmapped states have lower specificity than mapped ones', async () => {
    const originalOrder = lng.Config.stateOrder;

    // Only map $focus
    lng.Config.stateOrder = ['$focus'];

    let node!: lng.ElementNode;

    const dispose = renderer.render(() => (
      <view
        ref={node}
        color={0xff0000ff} // default red
        states={['$focus', '$hover']} // hover is unmapped
        $hover={{
          color: 0x00ff00ff, // green
          scale: 1.5,
          alpha: 0.5,
        }}
        $focus={{
          color: 0x0000ffff, // blue
          scale: 2.0,
        }}
      />
    ));

    await waitForUpdate();

    // even though $hover comes after $focus in the states array, it is unmapped,
    // so it has lower specificity than $focus
    v.assert.equal(node.color, 0x0000ffff);
    v.assert.equal(node.scale, 2.0);
    v.assert.equal(node.alpha, 0.5);

    dispose();
    lng.Config.stateOrder = originalOrder;
  });
});
