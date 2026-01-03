import { type ElementNode } from './elementNode.js';
import { isTextNode, isElementText } from './utils.js';

interface ProcessedChild {
  node: ElementNode;
  mainSize: number;
  marginStart: number;
  marginEnd: number;
  totalMainSizeOnAxis: number;
  isGrowItem: boolean;
  flexGrowValue: number;
  flexOrder: number;
  crossSize: number;
  crossMarginStart: number;
  crossMarginEnd: number;
}

export default function (node: ElementNode): boolean {
  const direction = node.flexDirection || 'row';
  const isRow = direction === 'row';
  const dimension = isRow ? 'width' : 'height';
  const crossDimension = isRow ? 'height' : 'width';
  const marginOne = isRow ? 'marginLeft' : 'marginTop';
  const crossMarginOne = isRow ? 'marginTop' : 'marginLeft';
  const marginTwo = isRow ? 'marginRight' : 'marginBottom';
  const crossMarginTwo = isRow ? 'marginBottom' : 'marginRight';

  const processedChildren: ProcessedChild[] = [];
  let hasOrder = false;
  let totalFlexGrow = 0;

  for (let i = 0; i < node.children.length; i++) {
    const c = node.children[i]!;

    if (isElementText(c) && c.text && !(c.width || c.height)) {
      return false;
    }

    if (isTextNode(c) || c.flexItem === false) {
      continue;
    }

    const flexOrder = c.flexOrder;
    if (flexOrder !== undefined) {
      hasOrder = true;
    }

    const flexGrow = c.flexGrow;
    const isGrowItem = flexGrow !== undefined && flexGrow >= 0;
    if (isGrowItem) {
      totalFlexGrow += flexGrow!;
    }

    const mainSize = c[dimension] || 0;
    const currentMarginStart = c[marginOne] || 0;
    const currentMarginEnd = c[marginTwo] || 0;

    processedChildren.push({
      node: c as ElementNode,
      mainSize: mainSize,
      marginStart: currentMarginStart,
      marginEnd: currentMarginEnd,
      totalMainSizeOnAxis: mainSize + currentMarginStart + currentMarginEnd,
      isGrowItem: isGrowItem,
      flexGrowValue: isGrowItem ? flexGrow! : 0,
      flexOrder: flexOrder || 0,
      crossSize: c[crossDimension] || 0,
      crossMarginStart: c[crossMarginOne] || 0,
      crossMarginEnd: c[crossMarginTwo] || 0,
    });
  }

  if (hasOrder) {
    processedChildren.sort((a, b) => a.flexOrder - b.flexOrder);
  } else if (node.direction === 'rtl') {
    processedChildren.reverse();
  }

  const numProcessedChildren = processedChildren.length;
  if (numProcessedChildren === 0) {
    return false; // No layout changes if no processable children
  }

  const prop = isRow ? 'x' : 'y';
  const crossProp = isRow ? 'y' : 'x';
  const containerSize = node[dimension] || 0;
  let containerCrossSize = node[crossDimension] || 0;
  const gap = node.gap || 0;
  const justify = node.justifyContent || 'flexStart';
  let containerUpdated = false;

  if (totalFlexGrow > 0 && numProcessedChildren > 1) {
    // When flex-grow is used, the container's size is considered fixed for this calculation pass,
    // unless flexBoundary is explicitly set to allow container resizing based on content.
    node.flexBoundary = node.flexBoundary || 'fixed';

    // Determine the sum of the flex base sizes of all items.
    // The flex base size is the item's mainSize before flex-grow is applied.
    let sumOfFlexBaseSizesWithMargins = 0;
    for (const pc of processedChildren) {
      sumOfFlexBaseSizesWithMargins +=
        pc.mainSize + pc.marginStart + pc.marginEnd;
    }

    // Calculate the total space occupied by gaps between items.
    const totalGapSpace =
      numProcessedChildren > 0 ? gap * (numProcessedChildren - 1) : 0;

    // Calculate the available space for flex items to grow into.
    const availableSpace =
      containerSize - sumOfFlexBaseSizesWithMargins - totalGapSpace;

    if (availableSpace > 0) {
      for (const pc of processedChildren) {
        if (pc.isGrowItem && pc.flexGrowValue > 0) {
          const shareOfSpace =
            (pc.flexGrowValue / totalFlexGrow) * availableSpace;
          const newMainSize = pc.mainSize + shareOfSpace;
          pc.node[dimension] = newMainSize;
          pc.mainSize = newMainSize;
          pc.totalMainSizeOnAxis = newMainSize + pc.marginStart + pc.marginEnd;
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
    for (const pc of processedChildren) {
      totalItemSize += pc.totalMainSizeOnAxis;
    }
  }

  const align = node.alignItems || (node.flexWrap ? 'flexStart' : undefined);
  const doCrossAlign = containerCrossSize
    ? (pc: ProcessedChild, crossCurrentPos: number = 0) => {
        const alignSelf = pc.node.alignSelf || align;
        if (!alignSelf) {
          return;
        }
        if (alignSelf === 'flexStart') {
          pc.node[crossProp] = crossCurrentPos + pc.crossMarginStart;
        } else if (alignSelf === 'center') {
          pc.node[crossProp] =
            crossCurrentPos +
            (containerCrossSize - pc.crossSize) / 2 +
            pc.crossMarginStart;
        } else if (alignSelf === 'flexEnd') {
          pc.node[crossProp] =
            crossCurrentPos +
            containerCrossSize -
            pc.crossSize -
            pc.crossMarginEnd;
        }
      }
    : (_pc: ProcessedChild, _crossCurrentPos: number = 0) => {
        /* no-op */
      };

  if (isRow && node._calcHeight && !node.flexCrossBoundary) {
    const maxHeight = processedChildren.reduce(
      (max, pc) => Math.max(max, pc.crossSize),
      0,
    );
    const newHeight = maxHeight || node.height;
    if (newHeight !== node.height) {
      containerUpdated = true;
      node.height = containerCrossSize = newHeight;
    }
  }

  let currentPos = node.padding || 0;
  if (justify === 'flexStart') {
    if (node.flexWrap === 'wrap') {
      let crossCurrentPos = 0;
      // use the child size to do wrap, not the container
      const childCrossSize =
        processedChildren[0]?.crossSize || containerCrossSize;
      const crossGap = isRow ? (node.columnGap ?? gap) : (node.rowGap ?? gap);
      for (const pc of processedChildren) {
        if (
          currentPos + pc.totalMainSizeOnAxis > containerSize &&
          currentPos > (node.padding || 0)
        ) {
          currentPos = node.padding || 0;
          crossCurrentPos += childCrossSize + crossGap;
        }
        pc.node[prop] = currentPos + pc.marginStart;
        currentPos += pc.totalMainSizeOnAxis + gap;
        doCrossAlign(pc, crossCurrentPos);
      }
      const finalCrossSize = crossCurrentPos + childCrossSize;
      if (node[crossDimension] !== finalCrossSize) {
        node[`preFlex${crossDimension}`] = node[crossDimension];
        node[crossDimension] = finalCrossSize;
        containerUpdated = true;
      }
    } else {
      for (const pc of processedChildren) {
        pc.node[prop] = currentPos + pc.marginStart;
        currentPos += pc.totalMainSizeOnAxis + gap;
        doCrossAlign(pc);
      }
    }
    // Update container size
    if (node.flexBoundary !== 'fixed' && node.flexWrap !== 'wrap') {
      const calculatedSize = currentPos - gap + (node.padding || 0);
      if (calculatedSize !== containerSize) {
        // store the original size for Row & Column
        node[`preFlex${dimension}`] = containerSize;
        node[dimension] = calculatedSize;
        return true;
      }
    }
  } else if (justify === 'flexEnd') {
    currentPos = containerSize - (node.padding || 0);
    for (let i = numProcessedChildren - 1; i >= 0; i--) {
      const pc = processedChildren[i]!;
      pc.node[prop] = currentPos - pc.mainSize - pc.marginEnd;
      currentPos -= pc.totalMainSizeOnAxis + gap;
      doCrossAlign(pc);
    }
  } else if (justify === 'center') {
    currentPos =
      (containerSize - (totalItemSize + gap * (numProcessedChildren - 1))) / 2 +
      (node.padding || 0);
    for (const pc of processedChildren) {
      pc.node[prop] = currentPos + pc.marginStart;
      currentPos += pc.totalMainSizeOnAxis + gap;
      doCrossAlign(pc);
    }
  } else if (justify === 'spaceBetween') {
    const spaceBetween =
      numProcessedChildren > 1
        ? (containerSize - totalItemSize - (node.padding || 0) * 2) /
          (numProcessedChildren - 1)
        : 0;
    currentPos = node.padding || 0;
    for (const pc of processedChildren) {
      pc.node[prop] = currentPos + pc.marginStart;
      currentPos += pc.totalMainSizeOnAxis + spaceBetween;
      doCrossAlign(pc);
    }
  } else if (justify === 'spaceAround') {
    const spaceAround =
      numProcessedChildren > 0
        ? (containerSize - totalItemSize - (node.padding || 0) * 2) /
          numProcessedChildren
        : 0;
    currentPos = (node.padding || 0) + spaceAround / 2;
    for (const pc of processedChildren) {
      pc.node[prop] = currentPos + pc.marginStart;
      currentPos += pc.totalMainSizeOnAxis + spaceAround;
      doCrossAlign(pc);
    }
  } else if (justify === 'spaceEvenly') {
    const spaceEvenly =
      (containerSize - totalItemSize - (node.padding || 0) * 2) /
      (numProcessedChildren + 1);
    currentPos = spaceEvenly + (node.padding || 0);
    for (const pc of processedChildren) {
      pc.node[prop] = currentPos + pc.marginStart;
      currentPos += pc.totalMainSizeOnAxis + spaceEvenly;
      doCrossAlign(pc);
    }
  }

  return containerUpdated;
}
