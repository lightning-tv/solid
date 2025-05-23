import * as s from 'solid-js'
import * as lng from '@lightningtv/solid'

import { chainFunctions } from './utils/chainFunctions.js'


export interface MarqueeAnimationProps {
  /** delay in ms between animations, @default 1000 */
  delay?: number
  /** pixels per second, @default 200 */
  speed?: number
  /**
   * distance between the end of the text and the start of the next animation
   * @default `0.5 * clipWidth`
   */
  gap?: number
  /** easing function, @default 'linear' */
  easing?: string
}

export interface MarqueeControlProps {
  /** whether to scroll the text or show it contained */
  marquee: boolean
}

export interface MarqueeTextProps
  extends lng.TextProps, MarqueeControlProps, MarqueeAnimationProps {
  /** width of the container */
  clipWidth: number
}

export interface MarqueeProps
  extends lng.NewOmit<lng.NodeProps, 'children'>, MarqueeControlProps, MarqueeAnimationProps {
  textProps?: lng.TextProps
  children:   lng.TextProps['children']
}

const SAFETY_MARGIN = 10

/**
 * MarqueeText is a component that scrolls text when it overflows the container.
 * 
 * @example
 * ```tsx
 * <view width={400} height={28} clipping>
 *   <MarqueeText
 *     clipWidth={400}
 *     marquee={inFocus()}
 *     speed={200}
 *     delay={1000}
 *     gap={24}
 *     easing='ease-in-out'
 *   >
 *     This is a long text that will scroll when it overflows the container.
 *   </MarqueeText>
 * </view>
 */
export function MarqueeText(props: MarqueeTextProps) {

  const speed = s.createMemo(() => props.speed || 200)
  const delay = s.createMemo(() => props.delay || 1000)
  const scrollGap = s.createMemo(() => props.clipWidth * 0.5)

  const [textWidth, setTextWidth] = s.createSignal(0)

  const isTextOverflowing = s.createMemo(() => textWidth() > props.clipWidth - SAFETY_MARGIN)
  const shouldScroll = s.createMemo(() => props.marquee && isTextOverflowing())

  const wasFocusedBefore = s.createMemo<boolean>(p => p || props.marquee, false)

  s.createEffect(() => {
    if (shouldScroll()) {

      let options: lng.AnimationSettings = {
        duration: (textWidth() + scrollGap()) / speed() * 1000,
        delay: delay(),
        loop: true,
        easing: props.easing,
      }

      text1.lng.x = 0
      text2.lng.x = textWidth() + scrollGap()

      let a1 = text1.lng.animate!({x: -textWidth() -scrollGap()}, options).start()
      let a2 = text2.lng.animate!({x: 0}, options).start()

      s.onCleanup(() => {
        a1.stop()
        a2.stop()
      })
    }
  })

  const events = {loaded(el: lng.ElementNode) {setTextWidth(el.width)}}

  let text1!: lng.ElementNode
  let text2!: lng.ElementNode
  return (
    <>
      {wasFocusedBefore() && <>
        <text {...props} ref={text1} hidden={!shouldScroll()} rtt maxLines={1} onEvent={events} />
        <text {...props} ref={text2} hidden={!shouldScroll()} rtt maxLines={1} />
      </>}
      <text {...props} maxLines={1} hidden={shouldScroll()} contain='width' />
    </>
  )
}

/**
 * Marquee is a component that scrolls text when it overflows the container.
 * It uses the {@link MarqueeText} component to do the actual scrolling.
 * 
 * @example
 * ```tsx
 * <Marquee
 *   width={400}
 *   marquee={inFocus()}
 *   easing='ease-in-out'
 *   textProps={{
 *     fontSize: 28,
 *   }}
 * >
 *   This is a long text that will scroll when it overflows the container.
 * </Marquee>
 * ```
 */
export function Marquee(props: MarqueeProps) {
  const [clipWidth, setClipWidth] = s.createSignal(props.width || 0)

  return (
    <view {...props}
      onLayout={/* @once */chainFunctions(props.onLayout, (e: lng.ElementNode) => setClipWidth(e.width))}
      clipping
    >
      <MarqueeText
        {...props.textProps}
        marquee={props.marquee}
        clipWidth={clipWidth()}
        speed={props.speed}
        delay={props.delay}
        gap={props.gap}
        easing={props.easing}
      >
        {props.children}
      </MarqueeText>
    </view>
  )
}
