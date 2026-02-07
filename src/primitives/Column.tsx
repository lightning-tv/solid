import { type Component } from 'solid-js';
import {
  ElementNode,
  combineStyles,
  type NodeStyles,
} from '@lightningtv/solid';
import {
  navigableForwardFocus,
  handleNavigation,
  defaultTransitionDown,
  defaultTransitionUp,
} from './utils/handleNavigation.js';
import { scrollColumn } from './utils/withScrolling.js';
import { chainFunctions } from './utils/chainFunctions.js';
import type { ColumnProps } from './types.js';

const ColumnStyles: NodeStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 30,
};

function scrollToIndex(this: ElementNode, index: number) {
  this.selected = index;
  scrollColumn(index, this);
  this.children[index]?.setFocus();
}

const onUp = handleNavigation('up');
const onDown = handleNavigation('down');

export const Column: Component<ColumnProps> = (props) => {
  return (
    <view
      transitionUp={defaultTransitionUp}
      transitionDown={defaultTransitionDown}
      transition={/* @once */ {}}
      {...props}
      onUp={/* @once */ chainFunctions(props.onUp, onUp)}
      onDown={/* @once */ chainFunctions(props.onDown, onDown)}
      selected={props.selected || 0}
      scrollToIndex={scrollToIndex}
      forwardFocus={navigableForwardFocus}
      onLayout={
        /* @once */
        props.selected
          ? chainFunctions(props.onLayout, scrollColumn)
          : props.onLayout
      }
      onSelectedChanged={
        /* @once */ chainFunctions(
          props.onSelectedChanged,
          props.scroll !== 'none' ? scrollColumn : undefined,
        )
      }
      style={/* @once */ combineStyles(props.style, ColumnStyles)}
    />
  );
};
