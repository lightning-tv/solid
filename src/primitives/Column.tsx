import { type Component } from 'solid-js';
import { ElementNode, View, combineStyles, type NodeStyles } from '@lightningtv/solid';
import {
  handleNavigation,
  onGridFocus,
  handleOnSelect,
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

const onUp = handleNavigation('up');
const onDown = handleNavigation('down');
const scroll = withScrolling(false);

function scrollToIndex(this: ElementNode, index: number) {
  this.selected = index;
  scroll(index, this);
  this.setFocus();
}

export const Column: Component<ColumnProps> = (props) => {
  return (
    <View
      {...props}
      onUp={/* @once */ chainFunctions(props.onUp, onUp)}
      onDown={/* @once */ chainFunctions(props.onDown, onDown)}
      selected={props.selected || 0}
      scrollToIndex={scrollToIndex}
      forwardFocus={onGridFocus}
      onFocus={
        /* @once */ chainFunctions(
          props.onFocus,
          props.onSelectedChanged && handleOnSelect(props.onSelectedChanged),
        )
      }
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
