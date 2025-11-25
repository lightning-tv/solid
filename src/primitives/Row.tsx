import { type Component } from 'solid-js';
import { combineStyles, type NodeStyles, type ElementNode } from '@lightningtv/solid';
import { chainFunctions } from './utils/chainFunctions.js';
import {
  handleNavigation,
  navigableForwardFocus
} from './utils/handleNavigation.js';
import type { RowProps } from './types.js';
import { scrollRow } from './utils/withScrolling.js';

const RowStyles: NodeStyles = {
  display: 'flex',
  gap: 30,
  transition: {
    x: {
      duration: 250,
      easing: 'ease-in-out',
    },
  },
};

function scrollToIndex(this: ElementNode, index: number) {
  this.selected = index;
  scrollRow(index, this);
  this.children[index]?.setFocus();
}

function isInNonScrollableZone(
  this: ElementNode,
  element?: ElementNode,
): boolean {
  const scroll = this.scroll;
  if (scroll !== 'bounded') {
    return false;
  }

  const upCount = (this.upCount || 6) as number;
  const totalItems = this.children.length;
  const nonScrollableZoneStart = Math.max(0, totalItems - upCount);

  if (element) {
    const elementIndex = this.children.indexOf(element);
    if (elementIndex === -1) return false;
    return elementIndex >= nonScrollableZoneStart;
  }

  const selected = this.selected ?? 0;
  return selected >= nonScrollableZoneStart;
}

const onLeft = handleNavigation('left');
const onRight = handleNavigation('right');

export const Row: Component<RowProps> = (props) => {
  return (
    <view
      {...props}
      selected={props.selected || 0}
      onLeft={/* @once */ chainFunctions(props.onLeft, onLeft)}
      onRight={/* @once */ chainFunctions(props.onRight, onRight)}
      forwardFocus={navigableForwardFocus}
      scrollToIndex={scrollToIndex}
      isInNonScrollableZone={isInNonScrollableZone}
      onLayout={
        /* @once */
        props.selected ? chainFunctions(props.onLayout, scrollRow) : props.onLayout
      }
      onSelectedChanged={
        /* @once */ chainFunctions(
        props.onSelectedChanged,
        props.scroll !== 'none' ? scrollRow : undefined,
      )
      }
      style={/* @once */ combineStyles(props.style, RowStyles)}
    />
  );
};
