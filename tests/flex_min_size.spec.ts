import { ElementNode } from '../src/core/elementNode.ts';
import calculateFlex from '../src/core/flex.ts';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isElementNode } from '../src/core/utils.ts';
import { NodeType } from '../src/core/nodeTypes.ts';
import type { ElementText, TextNode } from '../src/index.ts';

// Helper to create a basic ElementNode for flex testing
function createTestElement(
  initialProps: Partial<ElementNode> & {
    nodeType?: 'element' | 'textNode' | 'text';
    children?: Array<ElementNode | TextNode>;
  } = {},
): ElementNode | TextNode {
  if (initialProps.nodeType === 'text') {
    const textNodeInstance: TextNode = {
      _type: NodeType.Text,
      text: (initialProps as any).text || '',
    };
    return textNodeInstance;
  }

  const nodeTypeName =
    initialProps.nodeType === 'textNode' ? 'text' : 'element';
  const node = new ElementNode(nodeTypeName);

  for (const key in initialProps) {
    if (Object.prototype.hasOwnProperty.call(initialProps, key)) {
      if (key === 'children') continue;
      if (key === 'nodeType') continue;
      (node as any)[key] = (initialProps as any)[key];
    }
  }

  node.x = node.x || 0;
  node.y = node.y || 0;
  node.width = node.width || 0;
  node.height = node.height || 0;

  if (initialProps.children) {
    node.children = initialProps.children as Array<ElementNode | TextNode>;
    node.children.forEach((child) => {
      if (isElementNode(child)) {
        child.parent = node;
        child.rendered = true;
        child.width = child.width || 0;
        child.height = child.height || 0;
        child.x = child.x || 0;
        child.y = child.y || 0;
      } else {
        (child as TextNode).parent = node as unknown as ElementText;
      }
    });
  } else {
    node.children = [];
  }

  node.rendered = true;
  return node;
}

// Mock console.warn
let originalConsoleWarn: (...data: any[]) => void;
beforeEach(() => {
  originalConsoleWarn = console.warn;
  console.warn = vi.fn();
});
afterEach(() => {
  console.warn = originalConsoleWarn;
});

describe('Flexbox Layout (minWidth/minHeight)', () => {
  it('should respect minWidth', () => {
    const child1 = createTestElement({
      width: 10,
      minWidth: 50,
      height: 50,
    }) as ElementNode;
    const parent = createTestElement({
      width: 200,
      height: 100,
      flexDirection: 'row',
      children: [child1],
    }) as ElementNode;

    calculateFlex(parent);

    expect(child1.width).toBe(50);
  });

  it('should respect minHeight', () => {
    const child1 = createTestElement({
      width: 50,
      height: 10,
      minHeight: 50,
    }) as ElementNode;
    const parent = createTestElement({
      width: 200,
      height: 100,
      flexDirection: 'row',
      children: [child1],
    }) as ElementNode;

    calculateFlex(parent);

    expect(child1.height).toBe(50);
  });

  it('should respect minWidth with flexGrow', () => {
    const child1 = createTestElement({
      width: 10,
      minWidth: 50,
      height: 50,
      flexGrow: 1,
    }) as ElementNode;
    const child2 = createTestElement({
      width: 10,
      height: 50,
      flexGrow: 1,
    }) as ElementNode;
    const parent = createTestElement({
      width: 200, // Total 200. Base size child1=10(min50), child2=10.
      height: 100,
      flexDirection: 'row',
      children: [child1, child2],
    }) as ElementNode;

    // If implementing correct flex growing with min sizes:
    // Base sizes: child1 = 50 (due to minWidth), child2 = 10. Total base = 60.
    // Available space = 200 - 60 = 140.
    // Each gets 70.
    // child1 = 50 + 70 = 120.
    // child2 = 10 + 70 = 80.

    calculateFlex(parent);

    expect(child2.width).toBe(80);
  });

  it('should respect container minWidth', () => {
    const child1 = createTestElement({ width: 50, height: 50 }) as ElementNode;
    const child2 = createTestElement({ width: 50, height: 50 }) as ElementNode;
    const child3 = createTestElement({ width: 50, height: 50 }) as ElementNode;

    const parent = createTestElement({
      width: 0,
      minWidth: 250,
      height: 100,
      flexDirection: 'row',
      children: [child1, child2, child3],
    }) as ElementNode;

    calculateFlex(parent);

    // If container minWidth works, parent width should be 250
    expect(parent.width).toBe(250);
  });
});
