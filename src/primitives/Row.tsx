import { type Component } from 'solid-js';
import { combineStyles, type NodeStyles, View } from '@lightningtv/solid';
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

export const Row: Component<RowProps> = (props) => {
  return (
    <View
      {...props}
      selected={props.selected || 0}
      onLeft={chainFunctions(props.onLeft, onLeft)}
      onRight={chainFunctions(props.onRight, onRight)}
      onFocus={chainFunctions(
        props.onFocus,
        props.onSelectedChanged && handleOnSelect(props.onSelectedChanged),
      )}
      forwardFocus={onGridFocus}
      onLayout={
        props.selected ? chainFunctions(props.onLayout, scroll) : props.onLayout
      }
      onSelectedChanged={chainFunctions(
        props.onSelectedChanged,
        props.scroll !== 'none' ? scroll : undefined,
      )}
      style={combineStyles(props.style, RowStyles)}
    />
  );
};
