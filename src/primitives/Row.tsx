import { type Component } from 'solid-js';
import { combineStyles, type NodeStyles, View, type ElementNode } from '@lightningtv/solid';
import { chainFunctions } from './utils/chainFunctions.js';
import {
  handleNavigation,
  handleOnSelect,
  onGridFocus,
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

const onLeft = handleNavigation('left');
const onRight = handleNavigation('right');
const scroll = withScrolling(true);

function scrollToIndex(this: ElementNode, index: number) {
  this.selected = index;
  scroll(index, this);
  this.setFocus();
}

export const Row: Component<RowProps> = (props) => {
  return (
    <View
      {...props}
      selected={props.selected || 0}
      onLeft={/* @once */ chainFunctions(props.onLeft, onLeft)}
      onRight={/* @once */ chainFunctions(props.onRight, onRight)}
      onFocus={
        /* @once */ chainFunctions(
          props.onFocus,
          props.onSelectedChanged && handleOnSelect(props.onSelectedChanged),
        )
      }
      forwardFocus={onGridFocus}
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