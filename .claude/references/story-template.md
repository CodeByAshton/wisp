# Story Template Reference

## Canonical Story Shape

```tsx
// mocks/stories/StatusBadge.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'   // ← react-vite, not react
import { expect, userEvent, within } from 'storybook/test'     // ← storybook/test, not @storybook/test
import StatusBadge, { type StatusBadgeProps } from '../components/primitives/StatusBadge'
//                                                 ^^^ always relative from mocks/stories/

const meta = {
  title: 'Primitives/StatusBadge',   // mirrors layer: Primitives | Compositions | Layouts
  component: StatusBadge,
  parameters: { layout: 'centered' },
  argTypes: {
    status: {
      control: 'select',
      options: ['verified', 'signed', 'pending', 'expired'],
    },
  },
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Verified: Story = {
  args: { status: 'verified' },
  globals: { viewport: { value: 'mobile-sm' } },  // ← globals, not parameters.viewport
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="verified" />
      <StatusBadge status="signed" />
      <StatusBadge status="pending" />
      <StatusBadge status="expired" />
    </div>
  ),
  parameters: { layout: 'fullscreen' },
}

// Every interactive component needs at least one play() function
export const KeyboardNavigation: Story = {
  args: { status: 'verified' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const badge = canvas.getByRole('status')
    await expect(badge).toBeInTheDocument()
  },
}
```

---

## Import Paths — Get These Right

```tsx
// ✅ Framework import
import type { Meta, StoryObj } from '@storybook/react-vite'

// ✅ Test utilities
import { expect, fn, userEvent, within } from 'storybook/test'

// ✅ Component import — always relative from mocks/stories/
import MyComponent from '../components/primitives/MyComponent'
import MyComposition from '../components/compositions/MyComposition'
import MyLayout from '../layouts/MyLayout'

// ❌ Never use the @components alias in story files — breaks if src/ structure changes
import MyComponent from '@components/MyComponent'
```

---

## Title Convention

```
'Primitives/ComponentName'     → mocks/components/primitives/ComponentName.tsx
'Compositions/ComponentName'   → mocks/components/compositions/ComponentName.tsx
'Layouts/ComponentName'        → mocks/layouts/ComponentName.tsx
'Pages/PageName'               → mocks/stories/pages/PageName.stories.tsx
```

---

## Layout Parameter

| Value | Use when |
|---|---|
| `'centered'` | Primitive or small composition — renders centered in viewport |
| `'padded'` | Composition that needs breathing room |
| `'fullscreen'` | Layout / page-level story |

---

## Viewport Global

Use `globals` (not `parameters.viewport`) for mobile viewport:

```tsx
// ✅ Correct — Storybook 10 globals API
export const Mobile: Story = {
  args: { ... },
  globals: { viewport: { value: 'mobile-sm' } },
}

// ❌ Old API — avoid
parameters: { viewport: { defaultViewport: 'mobile1' } }
```

---

## Play Functions (interaction testing)

Every story that covers an interactive element **must** have a `play` function.
No separate `.test.tsx` files — all interaction testing lives in `play`.

```tsx
import { expect, fn, userEvent, within } from 'storybook/test'

export const ClickActivation: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Query by accessible role first — most resilient to refactors
    const button = canvas.getByRole('button', { name: /submit/i })
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const KeyboardActivation: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    const button = canvas.getByRole('button', { name: /submit/i })
    await expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard(' ')
    await expect(args.onClick).toHaveBeenCalledTimes(2)
  },
}
```

**Query priority (in order):**
1. `getByRole` — most resilient to refactors
2. `getByLabelText` — for form elements
3. `getByText` — for visible text content
4. `getByTestId` — last resort only

---

## ARIA Assertions in play()

```tsx
// Verify accessibility attributes
play: async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const btn = canvas.getByRole('button', { name: /saving/i })
  await expect(btn).toHaveAttribute('aria-busy', 'true')
  await expect(btn).toHaveAttribute('aria-disabled', 'true')
  await expect(btn).not.toHaveAttribute('disabled')  // stays in tab order
}
```

---

## Animated Components — Storybook Gotcha

react-spring animations need a wrapper with explicit height so the animated element
has a layout context:

```tsx
decorators: [
  (Story) => (
    <div className="relative h-[600px] w-full overflow-hidden">
      <Story />
    </div>
  ),
],
```

For BottomSheet / SwipeDismiss, add open/closed story variants:

```tsx
export const Open: Story = {
  args: { open: true, children: <p className="p-4">Sheet content</p> },
}
export const Closed: Story = {
  args: { open: false, children: <p className="p-4">Sheet content</p> },
}
```
