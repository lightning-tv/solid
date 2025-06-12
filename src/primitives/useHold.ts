import { createMemo } from 'solid-js';

export type UseHoldProps = {
  onHold: () => void;
  onEnter: () => void;
  onRelease?: () => void;
  holdThreshold?: number;
  performOnEnterImmediately?: boolean;
};

/**
 * @example
 * const [holdRight, releaseRight] = useHold({
 *   onHold: handleHoldRight,
 *   onEnter: handleOnRight,
 *   onRelease: handleReleaseHold,
 *   holdThreshold: 200,
 *   performOnEnterImmediately: true
 * });
 *
 * <View
 *   onRight={holdRight}
 *   onRightRelease={releaseRight}
 * />
 *
 * @param {UseHoldProps} props - The properties for configuring the hold behavior.
 * @returns {[() => boolean, () => boolean]} A tuple containing `startHold` and `releaseHold` functions.
 */

export function useHold(props: UseHoldProps) {
  const holdThreshold = createMemo(() => props.holdThreshold ?? 500);
  const performOnEnterImmediately = createMemo(
    () => props.performOnEnterImmediately ?? false,
  );

  let holdTimeout = -1;
  let wasHeld = false;

  const startHold = () => {
    if (holdTimeout === -1) {
      if (performOnEnterImmediately()) {
        props.onEnter();
      }
      holdTimeout = setTimeout(() => {
        wasHeld = true;
        props.onHold();
      }, holdThreshold()) as unknown as number;
    }
    return true;
  };

  const releaseHold = () => {
    if (holdTimeout !== -1) {
      clearTimeout(holdTimeout);
      holdTimeout = -1;
      if (!wasHeld) {
        if (!performOnEnterImmediately()) props.onEnter();
        return;
      }
      props.onRelease?.();
      wasHeld = false;
    }
    return true;
  };

  return [startHold, releaseHold];
}

export default useHold;
