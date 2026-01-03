// import { getTimingFunction, mergeColorProgress } from '@lightningjs/renderer/utils';
import { getTimingFunction, mergeColorProgress } from './timings.js';
import {
  type ElementNode,
  LightningRendererNumberProps,
} from './elementNode.js';
import { type IRendererStage } from './lightningInit.js';
import { TimingFunction } from '@lightningjs/renderer';
import { isFunc } from './utils.js';

/**
 * Simplified Animation Settings
 */
export interface SimpleAnimationSettings {
  duration?: number;
  delay?: number;
  easing?: string | TimingFunction;
}

/**
 * Properties of a Node used by the SimpleAnimation
 * (Excludes shaderProps)
 */
export type SimpleAnimationProps =
  (typeof LightningRendererNumberProps)[number];

/**
 * Configuration for a single node within a SimpleAnimation
 */
interface SimpleAnimationNodeConfig {
  node: ElementNode;
  duration: number;
  delay: number;
  easing: string | TimingFunction;
  progress: number;
  delayFor: number;
  timingFunction: (t: number) => number | undefined;
  propName: SimpleAnimationProps;
  startValue: number;
  targetValue: number;
}

export class SimpleAnimation {
  private nodeConfigs: SimpleAnimationNodeConfig[] = [];
  private isRegistered = false;
  private stage: IRendererStage | undefined;

  register(stage: IRendererStage) {
    if (this.isRegistered) {
      return;
    }
    this.isRegistered = true;
    this.stage = stage;
    stage.animationManager.registerAnimation(this);
  }

  /**
   * Adds a node and its animation properties to this animation instance.
   * The animation's start values for the specified properties are captured
   * from the node's current state when this method is called.
   *
   * @param node - The CoreNode to animate.
   * @param props - The properties to animate and their target values. Only number properties are supported.
   * @param settings - Animation settings for this specific node animation.
   */
  add(
    node: ElementNode,
    key: SimpleAnimationProps,
    value: number,
    settings: SimpleAnimationSettings,
  ): void {
    const existingConfig = this.nodeConfigs.find(
      (config) => config.node === node && config.propName === key,
    );

    const duration = settings.duration ?? 0;
    const delay = settings.delay ?? 0;
    const easing = settings.easing || 'linear';
    const timingFunction = isFunc(easing) ? easing : getTimingFunction(easing);
    const targetValue = value;
    const startValue = node[key] as number;

    if (existingConfig) {
      existingConfig.duration = duration;
      existingConfig.delay = delay;
      existingConfig.easing = easing;
      existingConfig.timingFunction = timingFunction;
      existingConfig.targetValue = targetValue;
      existingConfig.startValue = startValue;
      existingConfig.progress = 0;
      existingConfig.delayFor = delay;
    } else {
      this.nodeConfigs.push({
        node,
        duration,
        delay,
        easing,
        progress: 0,
        delayFor: delay,
        timingFunction,
        propName: key,
        startValue,
        targetValue,
      });
    }
  }

  update(dt: number) {
    // Iterate backward to safely remove finished animations
    for (let i = this.nodeConfigs.length - 1; i >= 0; i--) {
      const nodeConfig = this.nodeConfigs[i] as SimpleAnimationNodeConfig;
      const {
        node,
        duration,
        timingFunction,
        propName,
        startValue,
        targetValue,
      } = nodeConfig;
      let remainingDt = dt;

      // 1. Handle Delay
      if (nodeConfig.delayFor > 0) {
        nodeConfig.delayFor -= remainingDt;
        if (nodeConfig.delayFor >= 0) {
          // Still in delay phase for this node, skip applying values this frame
          continue;
        } else {
          // Delay finished this frame, use the remaining time for animation
          remainingDt = -nodeConfig.delayFor;
          nodeConfig.delayFor = 0;
        }
      }

      // 2. Update Progress (directly on nodeConfig.progress)
      if (duration > 0) {
        nodeConfig.progress += remainingDt / duration;
        // Clamp progress between 0 and 1
        nodeConfig.progress = Math.max(0, Math.min(1, nodeConfig.progress));
      } else if (duration === 0 && nodeConfig.delayFor <= 0) {
        // Duration is 0 and delay is finished or was 0. Animation completes instantly.
        nodeConfig.progress = 1;
      }

      // 3. Calculate Eased Progress
      const easedProgress =
        timingFunction(nodeConfig.progress) || nodeConfig.progress;

      // 4. Apply Animated Values to the Node
      let interpolatedValue: number;
      if (nodeConfig.progress === 1) {
        interpolatedValue = targetValue;
      } else {
        if (propName.includes('color')) {
          // Handle color interpolation
          interpolatedValue = mergeColorProgress(
            startValue,
            targetValue,
            easedProgress,
          );
        } else {
          // Handle linear interpolation for other number properties
          interpolatedValue =
            startValue + (targetValue - startValue) * easedProgress;
        }
      }
      // @typescript-eslint/no-explicit-any
      (node.lng as any)[propName] = interpolatedValue; // Cast to any because the properties on CoreNode might have broader types.

      // 5. Remove Node if Progress is 1
      if (nodeConfig.progress === 1) {
        this.nodeConfigs.splice(i, 1);
      }
      if (this.nodeConfigs.length === 0) {
        this.stage?.animationManager.unregisterAnimation(this);
        this.isRegistered = false;
      }
    }
  }
}

export const simpleAnimation = new SimpleAnimation();
export default simpleAnimation;
