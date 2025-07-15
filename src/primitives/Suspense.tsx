import * as s from 'solid-js';

/**
 * Tracks all resources inside a component and renders a fallback until they are all resolved.
 *
 * ```tsx
 * const [data] = createResource(async () => ...);
 *
 * <Suspense fallback={<LoadingIndicator />}>
 *   <view>
 *     <text>{data()}</text>
 *   </view>
 * </Suspense>
 * ```
 *
 * This is a modified version of the SolidJS Suspense component that works with Lightning.
 *
 * @see https://docs.solidjs.com/reference/components/suspense
 */
export function Suspense(props: {
  fallback?: s.JSX.Element;
  children: s.JSX.Element;
}): s.JSX.Element {

  let children: s.JSX.Element;

  let suspense = s.Suspense({
    get children() {
      return [children = s.children(() => props.children) as any];
    },
  }) as any as () => s.JSX.Element;

  return <>
    {suspense() ?? props.fallback}
    <view hidden>
      {suspense() ? null : children}
    </view>
  </>
}
