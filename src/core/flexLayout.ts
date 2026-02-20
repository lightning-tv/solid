import { type ElementNode } from './elementNode.js';
import { isTextNode, isElementText } from './utils.js';

function getArrayValue(
  val: number | [number, number, number, number] | undefined,
  index: number,
  defaultValue: number = 0,
): number {
  if (val === undefined) return defaultValue;
  if (typeof val === 'number') return val;
  return val[index] || defaultValue;
}

export default function (node: ElementNode): boolean {
  const direction = node.flexDirection || 'row';
  const isRow = direction === 'row';
  const dimension = isRow ? 'width' : 'height';
  const crossDimension = isRow ? 'height' : 'width';

  // padding order: Top, Right, Bottom, Left
  const nodePadding = node.padding;
  const paddingStart = isRow
    ? getArrayValue(nodePadding, 3)
    : getArrayValue(nodePadding, 0);
  const paddingEnd = isRow
    ? getArrayValue(nodePadding, 1)
    : getArrayValue(nodePadding, 2);
  const paddingCrossStart = isRow
    ? getArrayValue(nodePadding, 0)
    : getArrayValue(nodePadding, 3);
  const paddingCrossEnd = isRow
    ? getArrayValue(nodePadding, 2)
    : getArrayValue(nodePadding, 1);
  const nodePaddingTotal = paddingStart + paddingEnd;

  const minDimension = isRow ? 'minWidth' : 'minHeight';
  const crossMinDimension = isRow ? 'minHeight' : 'minWidth';

  const children = node.children;
  const numChildren = children.length;

  if (numChildren === 0) {
    return false;
  }

  // Optimize arrays caching
  let processableChildrenIndices: number[] = [];
  let hasOrder = false;
  let totalFlexGrow = 0;

  for (let i = 0; i < numChildren; i++) {
    const c = children[i]!;

    if (isElementText(c) && c.text && !(c.width || c.height)) {
      return false; // specific text layout constraint
    }

    if (isTextNode(c) || c.flexItem === false) {
      continue;
    }

    if (c.flexOrder !== undefined) {
      hasOrder = true;
    }

    const flexGrow = c.flexGrow;
    if (flexGrow !== undefined && flexGrow > 0) {
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
  } else if (node.direction === 'rtl') {
    processableChildrenIndices.reverse();
  }

  const numProcessedChildren = processableChildrenIndices.length;
  if (numProcessedChildren === 0) {
    return false;
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
  const gap = node.gap || 0;
  const justify = node.justifyContent || 'flexStart';
  const align = node.alignItems || (node.flexWrap ? 'flexStart' : undefined);
  let containerUpdated = false;

  // Resolve sizes matching old processed calculation
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
    const marginArray = c.margin;
    // index mappings for margins: Top: 0, Right: 1, Bottom: 2, Left: 3
    // if row: main = left/right (3/1), cross = top/bottom (0/2)
    const marginStart = isRow
      ? c.marginLeft || getArrayValue(marginArray, 3)
      : c.marginTop || getArrayValue(marginArray, 0);
    const marginEnd = isRow
      ? c.marginRight || getArrayValue(marginArray, 1)
      : c.marginBottom || getArrayValue(marginArray, 2);
    const marginCrossStart = isRow
      ? c.marginTop || getArrayValue(marginArray, 0)
      : c.marginLeft || getArrayValue(marginArray, 3);
    const marginCrossEnd = isRow
      ? c.marginBottom || getArrayValue(marginArray, 2)
      : c.marginRight || getArrayValue(marginArray, 1);

    const baseMainSize = c[dimension] || 0;

    childMainSizes[idx] = baseMainSize;
    childMarginStarts[idx] = marginStart;
    childMarginEnds[idx] = marginEnd;
    childTotalMainSizes[idx] = baseMainSize + marginStart + marginEnd;
    childCrossSizes[idx] = c[crossDimension] || 0;
    childMarginCrossStarts[idx] = marginCrossStart;
    childMarginCrossEnds[idx] = marginCrossEnd;

    sumOfFlexBaseSizesWithMargins += childTotalMainSizes[idx]!;
  }

  if (totalFlexGrow > 0 && numProcessedChildren > 1) {
    node.flexBoundary = node.flexBoundary || 'fixed';

    const totalGapSpace =
      numProcessedChildren > 0 ? gap * (numProcessedChildren - 1) : 0;
    const availableSpace =
      containerSize - sumOfFlexBaseSizesWithMargins - totalGapSpace;

    if (availableSpace > 0) {
      for (let idx = 0; idx < numProcessedChildren; idx++) {
        const c = children[processableChildrenIndices[idx]!] as ElementNode;
        const flexGrowValue = c.flexGrow || 0;
        if (flexGrowValue > 0) {
          const shareOfSpace = (flexGrowValue / totalFlexGrow) * availableSpace;
          const newMainSize = childMainSizes[idx]! + shareOfSpace;
          c[dimension] = newMainSize;
          childMainSizes[idx] = newMainSize;
          childTotalMainSizes[idx] =
            newMainSize + childMarginStarts[idx]! + childMarginEnds[idx]!;
        }
      }
      node._containsFlexGrow = node._containsFlexGrow ? null : true;
    } else if (node._containsFlexGrow) {
      node._containsFlexGrow = null;
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

  let currentPos = paddingStart;
  if (justify === 'flexStart') {
    if (node.flexWrap === 'wrap') {
      let crossCurrentPos = paddingCrossStart;
      const childCrossSize =
        numProcessedChildren > 0 ? childCrossSizes[0]! : containerCrossSize;
      const crossGap = isRow ? (node.columnGap ?? gap) : (node.rowGap ?? gap);

      for (let idx = 0; idx < numProcessedChildren; idx++) {
        const c = children[processableChildrenIndices[idx]!] as ElementNode;
        if (
          currentPos + childTotalMainSizes[idx]! > containerSize &&
          currentPos > paddingStart
        ) {
          currentPos = paddingStart;
          crossCurrentPos += childCrossSize + crossGap;
        }
        c[prop] = currentPos + childMarginStarts[idx]!;
        currentPos += childTotalMainSizes[idx]! + gap;
        doCrossAlign(c, idx, crossCurrentPos);
      }

      const finalCrossSize = crossCurrentPos + childCrossSize + paddingCrossEnd;
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
        doCrossAlign(c, idx, paddingCrossStart);
      }
    }

    // Update container size
    if (node.flexBoundary !== 'fixed' && node.flexWrap !== 'wrap') {
      let calculatedSize = currentPos - gap + paddingEnd;
      const minSize = node[minDimension] || 0;
      if (calculatedSize < minSize) {
        calculatedSize = minSize;
      }
      if (calculatedSize !== (node[dimension] || 0)) {
        node[`preFlex${dimension}`] = containerSize;
        node[dimension] = calculatedSize;
        return true;
      }
    }
  } else if (justify === 'flexEnd') {
    currentPos = containerSize - paddingEnd;
    for (let idx = numProcessedChildren - 1; idx >= 0; idx--) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos - childMainSizes[idx]! - childMarginEnds[idx]!;
      currentPos -= childTotalMainSizes[idx]! + gap;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  } else if (justify === 'center') {
    currentPos =
      (containerSize - (totalItemSize + gap * (numProcessedChildren - 1))) / 2 +
      paddingStart;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos + childMarginStarts[idx]!;
      currentPos += childTotalMainSizes[idx]! + gap;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  } else if (justify === 'spaceBetween') {
    const spaceBetween =
      numProcessedChildren > 1
        ? (containerSize - totalItemSize - nodePaddingTotal) /
          (numProcessedChildren - 1)
        : 0;
    currentPos = paddingStart;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos + childMarginStarts[idx]!;
      currentPos += childTotalMainSizes[idx]! + spaceBetween;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  } else if (justify === 'spaceAround') {
    const spaceAround =
      numProcessedChildren > 0
        ? (containerSize - totalItemSize - nodePaddingTotal) /
          numProcessedChildren
        : 0;
    currentPos = paddingStart + spaceAround / 2;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos + childMarginStarts[idx]!;
      currentPos += childTotalMainSizes[idx]! + spaceAround;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  } else if (justify === 'spaceEvenly') {
    const spaceEvenly =
      (containerSize - totalItemSize - nodePaddingTotal) /
      (numProcessedChildren + 1);
    currentPos = spaceEvenly + paddingStart;
    for (let idx = 0; idx < numProcessedChildren; idx++) {
      const c = children[processableChildrenIndices[idx]!] as ElementNode;
      c[prop] = currentPos + childMarginStarts[idx]!;
      currentPos += childTotalMainSizes[idx]! + spaceEvenly;
      doCrossAlign(c, idx, paddingCrossStart);
    }
  }

  return containerUpdated;
}
