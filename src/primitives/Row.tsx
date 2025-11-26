import { type Component } from 'solid-js';
import { combineStyles, type NodeStyles, type ElementNode } from '@lightningtv/solid';
import { chainFunctions } from './utils/chainFunctions.js';
import {
  handleNavigation,
  navigableForwardFocus
} from './utils/handleNavigation.js';
import type { RowProps } from './types.js';
import { scrollRow, checkIsInNonScrollableZone } from './utils/withScrolling.js';

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

const onLeft = handleNavigation('left');
const onRight = handleNavigation('right');

const isInNonScrollableZone = (container: ElementNode) => {
  return checkIsInNonScrollableZone(container);
};

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
