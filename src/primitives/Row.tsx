import { type Component } from 'solid-js';
import { combineStyles, type NodeStyles, type ElementNode } from '@lightningtv/solid';
import { chainFunctions } from './utils/chainFunctions.js';
import {
  navigableForwardFocus, navigableHandleNavigation
} from './utils/handleNavigation.js';
import { withScrolling } from './utils/withScrolling.js';
import type { RowProps } from './types.js';

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

const scroll = withScrolling(true);

function scrollToIndex(this: ElementNode, index: number) {
  this.selected = index;
  scroll(index, this);
  this.children[index]?.setFocus();
}

export const Row: Component<RowProps> = (props) => {
  return (
    <view
      {...props}
      selected={props.selected || 0}
      onLeft={/* @once */ chainFunctions(props.onLeft, navigableHandleNavigation)}
      onRight={/* @once */ chainFunctions(props.onRight, navigableHandleNavigation)}
      forwardFocus={navigableForwardFocus}
      scrollToIndex={scrollToIndex}
      onLayout={
        /* @once */
        props.selected ? chainFunctions(props.onLayout, scroll) : props.onLayout
      }
      onSelectedChanged={
        /* @once */ chainFunctions(
          props.onSelectedChanged,
          props.scroll !== 'none' ? scroll : undefined,
        )
      }
      style={/* @once */ combineStyles(props.style, RowStyles)}
    />
  );
};
