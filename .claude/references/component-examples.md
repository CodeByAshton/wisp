# Component Examples

## Example 1: Badge (Primitive)

**Input:** "A small label badge with variants: default, success, warning, destructive.
Optional dismiss button."

### components/primitives/Badge.tsx

```tsx
import { cn } from '@/lib/utils'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive'
export type BadgeSize = 'sm' | 'md'

export type BadgeProps = {
  label: string
  variant?: BadgeVariant
  size?: BadgeSize
  onDismiss?: () => void
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default:     'bg-neutral-100 text-neutral-700',
  success:     'bg-green-100 text-green-800',
  warning:     'bg-amber-100 text-amber-800',
  destructive: 'bg-red-100 text-red-700',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function Badge({
  label,
  variant = 'default',
  size = 'md',
  onDismiss,
  className,
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {label}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="
            -mr-1 ml-0.5 inline-flex h-5 w-5 items-center justify-center
            rounded-full transition-colors hover:bg-black/10
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
          "
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <path d="M6 4.586 9.293 1.293l1.414 1.414L7.414 6l3.293 3.293-1.414 1.414L6 7.414l-3.293 3.293-1.414-1.414L4.586 6 1.293 2.707 2.707 1.293 6 4.586Z" />
          </svg>
        </button>
      )}
    </span>
  )
}
```

**What to notice:**
- Variant and size maps defined outside the component (no re-creation on render)
- `onDismiss` is optional — dismiss button only renders when provided
- `className` passthrough for extension without wrapping divs
- `aria-label` on dismiss button (icon-only buttons always need one)
- `focus-visible:ring-2` on dismiss button — keyboard users can reach and activate it
- `transition-colors` appropriate here — hover state, not gesture-driven
- Badge itself is `<span>` not `<div>` — inline semantics for inline content

---

## Example 2: BottomSheet (Composition)

**Input:** "A bottom sheet that slides up from the bottom. Swipe down to dismiss.
Has a drag handle at the top."

### components/compositions/BottomSheet.tsx

```tsx
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { useReducedMotion } from '@react-spring/web'

export type BottomSheetProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

const SPRING_CONFIG = { tension: 280, friction: 26 }
const DISMISS_THRESHOLD_PX = 200
const VELOCITY_THRESHOLD = 0.5

export default function BottomSheet({
  open,
  onClose,
  children,
  className,
}: BottomSheetProps): React.ReactElement {
  const prefersReduced = useReducedMotion()
  const config = prefersReduced ? { duration: 0 } : SPRING_CONFIG

  const [{ y }, api] = useSpring(() => ({ y: open ? 0 : 100, config }))

  // Sync with open prop
  React.useEffect(() => {
    api.start({ y: open ? 0 : 100 })
  }, [open, api])

  const bind = useDrag(
    ({ last, velocity: [, vy], direction: [, dy], offset: [, oy], cancel }) => {
      if (oy < 0) cancel()       // don't allow dragging up past resting position
      if (last) {
        const shouldDismiss = oy > DISMISS_THRESHOLD_PX || (vy > VELOCITY_THRESHOLD && dy > 0)
        shouldDismiss
          ? api.start({ y: 150, config, onRest: onClose })
          : api.start({ y: 0, config })
      } else {
        // Immediate during drag — physics on release only
        api.start({ y: (oy / window.innerHeight) * 100, immediate: true })
      }
    },
    {
      from: () => [0, (y.get() / 100) * window.innerHeight],
      filterTaps: true,
      bounds: { top: 0 },
      rubberband: true,
    }
  )

  return (
    <animated.div
      {...bind()}
      style={{ translateY: y.to(v => `${v}%`) }}
      className={cn(
        'touch-none fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-2xl',
        className,
      )}
      role="dialog"
      aria-modal="true"
    >
      {/* Drag handle */}
      <div
        aria-hidden
        className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-neutral-300"
      />
      <div className="px-4 pb-safe-area-inset-bottom">{children}</div>
    </animated.div>
  )
}
```

**What to notice:**
- `useEffect` syncs the spring with the `open` prop — the component stays presentational
  (it doesn't decide when it opens; the parent passes `open`)
- `touch-none` prevents browser scroll interference during drag
- `immediate: true` during active drag; spring config only on release (velocity-aware)
- `pb-safe-area-inset-bottom` for iPhone home-indicator clearance
- `role="dialog" aria-modal="true"` — accessible even though it's animated

---

## When to Stop and Ask

Before building a composition or layout, always check whether the required primitives
already exist in `components/primitives/`. If they don't, build them first and emit their
stories before moving up the hierarchy. Never skip layers.