import { type Component } from 'solid-js';
import { ElementNode, combineStyles, type NodeStyles, Config } from '@lightningtv/solid';
import {
  handleNavigation,
  onGridFocus,
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
  const gridFocus = onGridFocus(props.onSelectedChanged);
  const refocus = (elm: ElementNode) => {
    if (elm.states.has(Config.focusStateKey)) {
      gridFocus.call(elm);
    }
  };

  return (
    <view
      {...props}
      onUp={/* @once */ chainFunctions(props.onUp, onUp)}
      onDown={/* @once */ chainFunctions(props.onDown, onDown)}
      selected={props.selected || 0}
      scrollToIndex={scrollToIndex}
      forwardFocus={gridFocus}
      onLayout={
        /* @once */
        props.selected ? chainFunctions(props.onLayout, refocus, scroll) : props.onLayout
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
