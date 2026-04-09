import type { Meta, StoryObj } from 'wisp'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Button',
  component: Button,
  parameters: {
    docs: `# Button

A versatile action trigger that supports multiple visual styles and sizes.

## Usage

\`\`\`tsx
import { Button } from './Button'

<Button variant="primary" label="Continue" />
<Button variant="destructive" size="sm" label="Delete" />
\`\`\`

## Variants

- **primary** — Blue fill, main action
- **secondary** — Subtle fill, secondary action
- **ghost** — Transparent, accent text, tertiary action
- **destructive** — Red fill, irreversible actions

## Accessibility

Always provide a \`label\` or \`children\`. The button supports all native \`<button>\` attributes including \`aria-label\`, \`aria-disabled\`, and \`type\`.
`,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    label: {
      control: 'text',
      description: 'Button label text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    loading: {
      control: 'boolean',
      description: 'Shows a loading spinner',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Stretches to fill container width',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { variant: 'primary', label: 'Continue', size: 'md' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', label: 'Cancel', size: 'md' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', label: 'Learn more', size: 'md' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', label: 'Delete account', size: 'md' },
}

export const Small: Story = {
  args: { variant: 'primary', label: 'Save', size: 'sm' },
}

export const Large: Story = {
  args: { variant: 'primary', label: 'Get started', size: 'lg' },
}

export const Loading: Story = {
  args: { variant: 'primary', label: 'Saving…', loading: true, size: 'md' },
}

export const Disabled: Story = {
  args: { variant: 'primary', label: 'Submit', disabled: true, size: 'md' },
}
