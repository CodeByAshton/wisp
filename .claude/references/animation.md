# Animation Reference

## The Reduced-Motion Guard (always first)

Every component that animates must import and respect `useReducedMotion`.

```tsx
import { useReducedMotion } from '@react-spring/web'

const SPRING_CONFIG = { tension: 280, friction: 26 }

function useMotionConfig() {
  const prefersReduced = useReducedMotion()
  return prefersReduced ? { duration: 0 } : SPRING_CONFIG
}
```

Pass the result as `config` to every `useSpring` / `useTransition` call.
This is not optional — it ships in every animated component.

---

## Pattern 1: Spring Entry (slide-up, fade-in)

Use for: BottomSheet, Modal, Toast, Drawer

```tsx
import { useSpring, animated } from '@react-spring/web'

export type BottomSheetProps = {
  open: boolean
  children: React.ReactNode
  onClose: () => void
}

export default function BottomSheet({
  open,
  children,
  onClose,
}: BottomSheetProps): React.ReactElement {
  const config = useMotionConfig()

  const spring = useSpring({
    y: open ? 0 : 100,          // percentage — keep in data, not style strings
    opacity: open ? 1 : 0,
    config,
  })

  return (
    <animated.div
      style={{
        transform: spring.y.to(y => `translateY(${y}%)`),
        opacity: spring.opacity,
      }}
      className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white shadow-xl"
    >
      {children}
    </animated.div>
  )
}
```

---

## Pattern 2: Drag to Dismiss (swipe-down sheet, swipe-away card)

Use for: BottomSheet dismiss, notification swipe, pull-to-close

```tsx
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

export default function SwipeDismissSheet({
  onClose,
  children,
}: SwipeDismissSheetProps): React.ReactElement {
  const config = useMotionConfig()
  const [{ y }, api] = useSpring(() => ({ y: 0, config }))

  const bind = useDrag(
    ({ last, velocity: [, vy], direction: [, dy], offset: [, oy], cancel }) => {
      // Cancel if dragging up
      if (oy < 0) cancel()

      if (last) {
        // Dismiss if fast flick down OR dragged > 40% of 500px assumed height
        oy > 200 || (vy > 0.5 && dy > 0)
          ? api.start({ y: 500, onRest: onClose })
          : api.start({ y: 0 })
      } else {
        api.start({ y: oy, immediate: true })
      }
    },
    { from: () => [0, y.get()], filterTaps: true, bounds: { top: 0 }, rubberband: true }
  )

  return (
    <animated.div
      {...bind()}
      style={{ y }}
      className="touch-none fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white shadow-xl"
    >
      {/* Drag handle */}
      <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-neutral-300" />
      {children}
    </animated.div>
  )
}
```

**Key details:**
- `touch-none` on the animated element — prevents browser scroll hijacking during drag
- `rubberband: true` — gives iOS-feel resistance at bounds
- Velocity threshold (`vy > 0.5`) makes fast flicks feel responsive
- `immediate: true` during active drag — spring physics apply only on release

---

## Pattern 3: Page Transitions (push/pop/crossfade)

Use for: route-level page changes, wizard step transitions

```tsx
import { useTransition, animated } from '@react-spring/web'

type TransitionDirection = 'push' | 'pop' | 'crossfade'

const TRANSITIONS: Record<TransitionDirection, {
  from: object; enter: object; leave: object
}> = {
  push: {
    from:  { opacity: 0, transform: 'translateX(100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(-30%)' },
  },
  pop: {
    from:  { opacity: 0, transform: 'translateX(-100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(30%)' },
  },
  crossfade: {
    from:  { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  },
}

export type PageTransitionProps = {
  pageKey: string
  direction?: TransitionDirection
  children: React.ReactNode
}

export default function PageTransition({
  pageKey,
  direction = 'push',
  children,
}: PageTransitionProps): React.ReactElement {
  const config = useMotionConfig()
  const { from, enter, leave } = TRANSITIONS[direction]

  const transitions = useTransition(pageKey, {
    key: pageKey,
    from,
    enter,
    leave,
    config,
  })

  return transitions((style, _key) => (
    <animated.div style={style} className="absolute inset-0">
      {children}
    </animated.div>
  ))
}
```

---

## What NOT to do

```tsx
// ❌ Never use CSS transition for gesture-driven animation
<div className="transition-transform duration-300" style={{ transform: `translateY(${y}px)` }} />
// CSS transitions don't respond to velocity — they feel mechanical on drag release

// ✅ CSS transition is fine for hover/focus only
<button className="transition-colors hover:bg-neutral-100 focus:ring-2" />

// ❌ Never animate without reduced motion guard
const spring = useSpring({ y: 0 })   // missing config

// ✅ Always pass config from useMotionConfig()
const config = useMotionConfig()
const spring = useSpring({ y: 0, config })
```