import { type Component } from 'solid-js';
import { ElementNode, combineStyles, type NodeStyles } from '@lightningtv/solid';
import {
  navigableForwardFocus, navigableHandleNavigation
} from './utils/handleNavigation.js';
import { withScrolling } from './utils/withScrolling.js';
import { chainFunctions } from './utils/chainFunctions.js';
import type { ColumnProps } from './types.js';

const ColumnStyles: NodeStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 30,
  transition: {
    y: {
      duration: 250,
      easing: 'ease-in-out',
    },
  },
};

const scroll = withScrolling(false);

function scrollToIndex(this: ElementNode, index: number) {
  this.selected = index;
  scroll(index, this);
  this.children[index]?.setFocus();
}

export const Column: Component<ColumnProps> = (props) => {
  return (
    <view
      {...props}
      onUp={/* @once */ chainFunctions(props.onUp, navigableHandleNavigation)}
      onDown={/* @once */ chainFunctions(props.onDown, navigableHandleNavigation)}
      selected={props.selected || 0}
      scrollToIndex={scrollToIndex}
      forwardFocus={navigableForwardFocus}
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
      style={/* @once */ combineStyles(props.style, ColumnStyles)}
    />
  );
};
