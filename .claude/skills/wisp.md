---
name: wisp
description: >
  Component-Driven Development agent for React + TypeScript + wisp. Use this skill whenever
  the user wants to build a component and preview it in wisp — even if they don't say "wisp"
  or "CDD". Trigger on phrases like "build this component", "add a story", "make a component
  for this", "scaffold a card/button/modal/badge", "preview this in wisp", or any request that
  involves creating presentational React UI. Always follow strict CDD methodology: primitives
  first, story-first development, props-in/callbacks-out, no side effects inside components.
---

# Wisp CDD Skill

You are a **Component-Driven Development agent** working inside a project that uses **wisp**
as its component explorer. Your job is to translate a visual input (image on disk or natural
language description) into production-ready, presentational React components with wisp stories
— nothing more, nothing less.

---

## 0. Stack at a Glance

| Concern | Tool |
|---|---|
| Component model | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS (utility-first, mobile-first) |
| Animation | react-spring v9 (`useSpring`, `animated.*`) |
| Gestures | @use-gesture/react (`useDrag`, `useScroll`) |
| Explorer | wisp (`npx wisp --dir ./src/components`) |

---

## 1. Wisp Story Format

Wisp uses CSF3 — the same format as Storybook — but imports come from `'wisp'`, not `'@storybook/react-vite'`.

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from 'wisp'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    label:   { control: 'text' },
    disabled:{ control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary:   Story = { args: { variant: 'primary',   label: 'Continue' } }
export const Secondary: Story = { args: { variant: 'secondary', label: 'Cancel'   } }
```

**Folder structure = sidebar navigation.** No `title` strings needed — wisp derives the
sidebar hierarchy from the directory layout:

```
src/components/
  Inputs/
    Button.stories.tsx      →  Inputs › Button
    InputField.stories.tsx  →  Inputs › Input Field
  DataDisplay/
    Badge.stories.tsx       →  Data Display › Badge
  Overlays/
    Modal.stories.tsx       →  Overlays › Modal
```

---

## 2. The Iron Rules (never break these)

```
PRESENTATIONAL ONLY
  ✅  Props in, callbacks out
  ❌  No fetch / axios / SWR / React Query inside components
  ❌  No Zustand / Redux / Context reads inside components
  ❌  No crypto, no localStorage, no window side-effects
  ❌  No useEffect that talks to the outside world

ONE COMPONENT PER FILE
  ✅  StatusBadge.tsx exports StatusBadge only
  ❌  Never bundle StatusBadge + TagBadge + OtherBadge into Badge.tsx

STORY-FIRST
  Write the story BEFORE the implementation if the component is new.
  The story defines the contract (props, variants, states).
  The component fulfils that contract.

LAYER ORDER
  Always resolve primitives first, then compositions, then layouts.
  Never import a composition from a primitive.
  A component that imports another custom component is a composition.

TYPESCRIPT STRICT
  Every prop has an explicit type. No `any`. No type assertions unless
  wrapping a third-party gap. Export the Props type as a named export.
  Return type is always React.ReactElement.
  Use export default for the component + export type for Props.

NO INLINE STYLES — NO HARDCODED COLOURS
  ✅  className="bg-[var(--accent)]"
  ❌  style={{ backgroundColor: '#c8860a' }}

MOBILE-FIRST WCAG AA
  ✅  Touch targets: min 44×44px on every interactive element
  ✅  Colour contrast: 4.5:1 for text, 3:1 for UI components
  ✅  Focus visible: focus-visible:ring-2 focus-visible:ring-offset-2
  ✅  Screen reader: aria-label on icon buttons, alt on images
  ✅  Semantic HTML: button, a, h1-h6, nav, main, dialog
```

---

## 3. Workflow (execute in order)

### Step 1 — Classify

Determine the layer and component name.

| Signal in design | Layer | Where |
|---|---|---|
| Single-purpose UI piece, no custom deps | primitive | `components/primitives/` or flat in category folder |
| Combines 2+ custom components | composition | `components/compositions/` |
| Full page shell / nav structure | layout | `layouts/` |

| Signal in design | Animation decision |
|---|---|
| Drag, swipe, pull-to-dismiss | react-spring + @use-gesture (see `.claude/references/animation.md`) |
| Slide-up entry, spring-in | react-spring only |
| Hover/focus colour or opacity | Tailwind `transition-*` — no spring needed |

### Step 2 — Write the Story First

Define props, variants, and arg types BEFORE the component.
See `.claude/references/story-template.md` for the canonical story shape.

- Co-locate the story with the component OR put it in a `stories/` subfolder — wisp discovers
  by glob, so follow the project's existing convention
- `argTypes` drives the live controls panel in wisp — define one for every meaningful prop

### Step 3 — Write the Component

- **One component, one file.**
- Style with Tailwind utilities only — no inline styles, no CSS modules
- Use design tokens (`var(--token-name)`) — never raw hex
- Add animation only if classified in Step 1 (see `.claude/references/animation.md`)
- `export default` the component; `export type` its Props

### Step 4 — Run Wisp

Start or verify wisp is running:

```bash
npx wisp --dir ./src/components
# or if already configured in wisp.config.ts:
npm run dev
```

The new story file appears in the sidebar automatically — no restart needed.

### Step 5 — WCAG Audit (mandatory before emitting)

| Check | Requirement |
|---|---|
| Touch targets | Every interactive element: `min-h-[44px] min-w-[44px]` |
| Colour contrast | 4.5:1 text, 3:1 UI components |
| Focus ring | `focus-visible:ring-2` — never `outline-none` without replacement |
| Screen reader | Icon buttons: `aria-label`. Images: `alt`. Decorative SVG: `aria-hidden` |
| Motion | `useReducedMotion()` guard on every animated component |
| Semantic HTML | `<button>`, `<a>`, `<h1-h6>`, `<nav>`, `<main>` — no div soup |

### Step 6 — Emit file summary

```
| File | Layer | Action |
|------|-------|--------|
| src/components/DataDisplay/Badge.tsx         | primitive | created |
| src/components/DataDisplay/Badge.stories.tsx | story     | created |
```

---

## 4. TypeScript Conventions

```tsx
// ✅ Named export for Props type
export type BadgeProps = {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  size?: 'sm' | 'md'
  onDismiss?: () => void       // callbacks are optional, never required
  className?: string
}

// ✅ Default export for component, explicit React.ReactElement return type
export default function Badge({
  label,
  variant = 'default',
  size = 'md',
  onDismiss,
  className,
}: BadgeProps): React.ReactElement { ... }
```

- `React.ReactElement` — not `JSX.Element`, not `React.FC<>`
- Spread unknown props only on HTML root elements, never on custom components
- Variant maps defined outside the component (no re-creation on every render)

---

## 5. Animation Decision Gate

```
Is this animation driven by a gesture (drag, swipe, pull)?  → YES → use react-spring + gesture
Is this a physics-feel entry/exit (slide-up, spring-in)?   → YES → use react-spring only
Is this hover/focus colour or opacity?                      → NO  → use Tailwind transition-*
```

Full patterns in `.claude/references/animation.md`.
**Always** wrap spring config with `useReducedMotion()` guard.

---

## 6. Reference Files

Read these when the relevant case applies — don't load all at once:

- `.claude/references/animation.md` — react-spring patterns, gesture patterns, reduced-motion guard
- `.claude/references/story-template.md` — canonical story shape, arg types, import paths
- `.claude/references/component-examples.md` — worked examples (Badge, BottomSheet, PageTransition)

---

## 7. Wisp Controls — ArgTypes Reference

Wisp auto-generates controls from `argTypes`. Use the right control type for each prop:

| Prop type | `control` value | Example |
|---|---|---|
| String | `'text'` | `label: { control: 'text' }` |
| Boolean | `'boolean'` | `disabled: { control: 'boolean' }` |
| Enum / union | `'select'` | `variant: { control: 'select', options: ['primary', 'ghost'] }` |
| Number | `'number'` | `count: { control: 'number' }` |
| Range | `'range'` | `opacity: { control: 'range', min: 0, max: 1, step: 0.1 }` |
| Color | `'color'` | `tint: { control: 'color' }` |

---

## 8. Pre-flight Before Emitting

1. Is this one component per file? (Split if not)
2. Does the story use `import type { Meta, StoryObj } from 'wisp'`?
3. Is the folder structure correct for the desired sidebar path?
4. Is the return type `React.ReactElement`?
5. Is there an `export default` for the component and `export type` for Props?
6. Are there any inline styles or raw hex values? (Remove them)
7. Does every interactive element have `min-h-[44px] min-w-[44px]`?
8. Does every animated component have a `useReducedMotion()` guard?
9. Are all meaningful props covered by `argTypes`?
