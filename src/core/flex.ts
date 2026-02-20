import { type ElementNode } from './elementNode.js';
import { isTextNode, isElementText } from './utils.js';

export default function (node: ElementNode): boolean {
  const direction = node.flexDirection || 'row';
  const isRow = direction === 'row' || direction === 'row-reverse';
  const isReverse =
    direction === 'row-reverse' || direction === 'column-reverse';
  const dimension = isRow ? 'width' : 'height';
  const crossDimension = isRow ? 'height' : 'width';
  const marginOne = isRow ? 'marginLeft' : 'marginTop';
  const crossMarginOne = isRow ? 'marginTop' : 'marginLeft';
  const marginTwo = isRow ? 'marginRight' : 'marginBottom';
  const crossMarginTwo = isRow ? 'marginBottom' : 'marginRight';
  const minDimension = isRow ? 'minWidth' : 'minHeight';
  const crossMinDimension = isRow ? 'minHeight' : 'minWidth';

  const children = node.children;
  const numChildren = children.length;

  if (numChildren === 0) {
    return false;
  }

  let processableChildrenIndices: number[] = [];
  let hasOrder = false;
  let totalFlexGrow = 0;

  for (let i = 0; i < numChildren; i++) {
    const c = children[i]!;

    if (isElementText(c) && c.text && !(c.width || c.height)) {
      return false;
    }

    if (isTextNode(c) || c.flexItem === false) {
      continue;
    }

    if (c.flexOrder !== undefined) {
      hasOrder = true;
    }

    const flexGrow = c.flexGrow;
    if (flexGrow !== undefined && flexGrow >= 0) {
      totalFlexGrow += flexGrow;
    }

    if (c[minDimension] && (c[dimension] || 0) < c[minDimension]!) {
      c[dimension] = c[minDimension]!;
    }

    if (
      c[crossMinDimension] &&
      (c[crossDimension] || 0) < c[crossMinDimension]!
    ) {
      c[crossDimension] = c[crossMinDimension]!;
    }

    processableChildrenIndices.push(i);
  }

  if (hasOrder) {
    processableChildrenIndices.sort((aIdx, bIdx) => {
      const a = children[aIdx] as ElementNode;
      const b = children[bIdx] as ElementNode;
      return (a.flexOrder || 0) - (b.flexOrder || 0);
    });
  }

  if (isReverse || node.direction === 'rtl') {
    processableChildrenIndices.reverse();
  }

  const numProcessedChildren = processableChildrenIndices.length;
  if (numProcessedChildren === 0) {
    return false; // No layout changes if no processable children
  }

  const prop = isRow ? 'x' : 'y';
  const crossProp = isRow ? 'y' : 'x';
  const containerSize = Math.max(
    node[dimension] || 0,
    node[minDimension] || 0,
    0,
  );
  let containerCrossSize = Math.max(
    node[crossDimension] || 0,
    node[crossMinDimension] || 0,
    0,
  );
  const isWrapReverse = node.flexWrap === 'wrap-reverse';
  const gap = node.gap || 0;
  const justify = node.justifyContent || 'flexStart';
  const nodePadding = (node.padding as number) || 0;
  let containerUpdated = false;

  const childMainSizes = new Float32Array(numProcessedChildren);
  const childMarginStarts = new Float32Array(numProcessedChildren);
  const childMarginEnds = new Float32Array(numProcessedChildren);
  const childTotalMainSizes = new Float32Array(numProcessedChildren);
  const childCrossSizes = new Float32Array(numProcessedChildren);
  const childMarginCrossStarts = new Float32Array(numProcessedChildren);
  const childMarginCrossEnds = new Float32Array(numProcessedChildren);

  let sumOfFlexBaseSizesWithMargins = 0;

  for (let idx = 0; idx < numProcessedChildren; idx++) {
    const c = children[processableChildrenIndices[idx]!] as ElementNode;

    const baseMainSize = c[dimension] || 0;
    const marginStart = (c[marginOne] as number) || 0;
    const marginEnd = (c[marginTwo] as number) || 0;

    childMainSizes[idx] = baseMainSize;
    childMarginStarts[idx] = marginStart;
    childMarginEnds[idx] = marginEnd;
    childTotalMainSizes[idx] = baseMainSize + marginStart + marginEnd;

    childCrossSizes[idx] = c[crossDimension] || 0;
    childMarginCrossStarts[idx] = (c[crossMarginOne] as number) || 0;
    childMarginCrossEnds[idx] = (c[crossMarginTwo] as number) || 0;

    sumOfFlexBaseSizesWithMargins += childTotalMainSizes[idx]!;
  }

  if (totalFlexGrow > 0 && numProcessedChildren > 1) {
    // When flex-grow is used, the container's size is considered fixed for this calculation pass,
    // unless flexBoundary is explicitly set to allow container resizing based on content.
    node.flexBoundary = node.flexBoundary || 'fixed';

    // Calculate the total space occupied by gaps between items.
    const totalGapSpace =
      numProcessedChildren > 0 ? gap * (numProcessedChildren - 1) : 0;

    // Calculate the available space for flex items to grow into.
    const availableSpace =
      containerSize - sumOfFlexBaseSizesWithMargins - totalGapSpace;

    if (availableSpace > 0) {
      for (let idx = 0; idx < numProcessedChildren; idx++) {
        const c = children[processableChildrenIndices[idx]!] as ElementNode;
        const flexGrowValue = c.flexGrow;
        if (flexGrowValue !== undefined && flexGrowValue > 0) {
          const shareOfSpace = (flexGrowValue / totalFlexGrow) * availableSpace;
          const newMainSize = childMainSizes[idx]! + shareOfSpace;
          c[dimension] = newMainSize;
          childMainSizes[idx] = newMainSize;
          childTotalMainSizes[idx] =
            newMainSize + childMarginStarts[idx]! + childMarginEnds[idx]!;
        }
      }
      // prevent infinite loops by only doing this once
      node._containsFlexGrow = node._containsFlexGrow ? null : true;
    } else if (node._containsFlexGrow) {
      node._containsFlexGrow = null;
    } else {
      // No positive space available for items to grow, or items overflow.
      // flex-grow has no effect in this case.
      console.warn(
        'No available space for flex-grow items to expand, or items overflow.',
      );
    }
  }

  let totalItemSize = 0;
  if (
    justify === 'center' ||
    justify === 'spaceBetween' ||
    justify === 'spaceEvenly' ||
    justify === 'spaceAround'
  ) {
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      totalItemSize += childTotalMainSizes[idx]!;
    }
  }

  const align = node.alignItems || (node.flexWrap ? 'flexStart' : undefined);
  const doCrossAlign = containerCrossSize
    ? (c: ElementNode, idx: number, crossCurrentPos: number = 0) => {
        const alignSelf = c.alignSelf || align;
        if (!alignSelf) {
          return;
        }
        if (alignSelf === 'flexStart') {
          c[crossProp] = crossCurrentPos + childMarginCrossStarts[idx]!;
        } else if (alignSelf === 'center') {
          c[crossProp] =
            crossCurrentPos +
            (containerCrossSize - childCrossSizes[idx]!) / 2 +
            childMarginCrossStarts[idx]!;
        } else if (alignSelf === 'flexEnd') {
          c[crossProp] =
            crossCurrentPos +
            containerCrossSize -
            childCrossSizes[idx]! -
            childMarginCrossEnds[idx]!;
        }
      }
    : (_c: ElementNode, _idx: number, _crossCurrentPos: number = 0) => {
        /* no-op */
      };

  if (isRow && node._calcHeight && !node.flexCrossBoundary) {
    let maxHeight = 0;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      if (childCrossSizes[idx]! > maxHeight) maxHeight = childCrossSizes[idx]!;
    }
    const newHeight = maxHeight || node.height;
    if (newHeight !== node.height) {
      containerUpdated = true;
      node.height = containerCrossSize = newHeight;
    }
  }

  let currentPos = nodePadding;
  if (justify === 'flexStart') {
    if (node.flexWrap === 'wrap' || isWrapReverse) {
      const childCrossSizeVar =
        numProcessedChildren > 0 ? childCrossSizes[0]! : containerCrossSize;
      let crossCurrentPos = isWrapReverse
        ? containerCrossSize - childCrossSizeVar
        : 0;
      const crossGap = isRow ? (node.columnGap ?? gap) : (node.rowGap ?? gap);

      for (let idx = 0; idx < numProcessedChildren; idx++) {
        const c = children[processableChildrenIndices[idx]!] as ElementNode;
        if (
          currentPos + childTotalMainSizes[idx]! > containerSize &&
          currentPos > nodePadding
        ) {
          currentPos = nodePadding;
          crossCurrentPos += isWrapReverse
            ? -(childCrossSizeVar + crossGap)
            : childCrossSizeVar + crossGap;
        }
        c[prop] = currentPos + childMarginStarts[idx]!;
        currentPos += childTotalMainSizes[idx]! + gap;
        doCrossAlign(c, idx, crossCurrentPos);
      }

      const finalCrossSize = isWrapReverse
        ? containerCrossSize - crossCurrentPos
        : crossCurrentPos + childCrossSizeVar;

      if (node[crossDimension] !== finalCrossSize) {
        node[`preFlex${crossDimension}`] = node[crossDimension];
        node[crossDimension] = finalCrossSize;
        containerUpdated = true;
      }
    } else {
      for (let idx = 0; idx < numProcessedChildren; idx++) {
        const c = children[processableChildrenIndices[idx]!] as ElementNode;
        c[prop] = currentPos + childMarginStarts[idx]!;
        currentPos += childTotalMainSizes[idx]! + gap;
        doCrossAlign(c, idx);
      }
    }
    // Update container size
    if (node.flexBoundary !== 'fixed' && node.flexWrap !== 'wrap') {
      let calculatedSize = currentPos - gap + nodePadding;
      const minSize = node[minDimension] || 0;
      if (calculatedSize < minSize) {
        calculatedSize = minSize;
      }
      if (calculatedSize !== (node[dimension] || 0)) {
        // store the original size for Row & Column
        node[`preFlex${dimension}`] = containerSize;
        node[dimension] = calculatedSize;
        return true;
      }
    }
  } else if (justify === 'flexEnd') {
    currentPos = containerSize - nodePadding;
    for (let idx = numProcessedChildren - 1; idx >= 0; idx--) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos - childMainSizes[idx]! - childMarginEnds[idx]!;
      currentPos -= childTotalMainSizes[idx]! + gap;
      doCrossAlign(c, idx);
    }
  } else if (justify === 'center') {
    currentPos =
      (containerSize - (totalItemSize + gap * (numProcessedChildren - 1))) / 2 +
      nodePadding;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos + childMarginStarts[idx]!;
      currentPos += childTotalMainSizes[idx]! + gap;
      doCrossAlign(c, idx);
    }
  } else if (justify === 'spaceBetween') {
    const spaceBetween =
      numProcessedChildren > 1
        ? (containerSize - totalItemSize - nodePadding * 2) /
          (numProcessedChildren - 1)
        : 0;
    currentPos = nodePadding;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos + childMarginStarts[idx]!;
      currentPos += childTotalMainSizes[idx]! + spaceBetween;
      doCrossAlign(c, idx);
    }
  } else if (justify === 'spaceAround') {
    const spaceAround =
      numProcessedChildren > 0
        ? (containerSize - totalItemSize - nodePadding * 2) /
          numProcessedChildren
        : 0;
    currentPos = nodePadding + spaceAround / 2;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos + childMarginStarts[idx]!;
      currentPos += childTotalMainSizes[idx]! + spaceAround;
      doCrossAlign(c, idx);
    }
  } else if (justify === 'spaceEvenly') {
    const spaceEvenly =
      (containerSize - totalItemSize - nodePadding * 2) /
      (numProcessedChildren + 1);
    currentPos = spaceEvenly + nodePadding;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos + childMarginStarts[idx]!;
      currentPos += childTotalMainSizes[idx]! + spaceEvenly;
      doCrossAlign(c, idx);
    }
  }

  return containerUpdated;
}
